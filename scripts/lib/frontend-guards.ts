import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { ensureDir, walkFiles, isObject } from './files.ts';
import { ValidationError } from './validation.ts';
import { webpDimensions } from './review-media.ts';

export const JAVASCRIPT_BUDGET = Object.freeze({ main: 90_000, architecture: 180_000 });

export async function stagePublicAssets(projects: readonly unknown[], sourceDir: string, destination: string, recommendations: readonly unknown[] = []) {
  if ((await fs.lstat(sourceDir)).isSymbolicLink()) {
    throw new ValidationError('The public asset directory cannot be a symbolic link.');
  }
  // Do not give Astro the repository's whole public directory. Only the site
  // icon and explicitly reviewed project visuals become build inputs.
  const assets = new Map<string, boolean>([['assets/favicon.svg', false]]);
  const portraits = new Map<string, { width: number; height: number }>();
  const projectDimensions = new Map<string, { width: number; height: number }>();
  for (const project of projects) {
    if (!isObject(project)) throw new ValidationError('Invalid project asset reference.');
    if (project.presentation === undefined) continue;
    if (!isObject(project.presentation) || !isObject(project.presentation.preview)) throw new ValidationError('Invalid project presentation.');
    const gallery = project.presentation.gallery;
    if (gallery !== undefined && (!Array.isArray(gallery) || gallery.length < 1 || gallery.length > 6)) {
      throw new ValidationError('Project galleries require one to six approved images.');
    }
    for (const preview of [project.presentation.preview, ...(Array.isArray(gallery) ? gallery : [])]) {
      if (!isObject(preview)) throw new ValidationError('Invalid project image.');
      if (preview.kind === 'diagram' && preview === project.presentation.preview) continue;
      if (preview.kind !== 'image' || typeof preview.src !== 'string' || !/^assets\/projects\/[a-z0-9][a-z0-9._-]*\.(?:avif|webp)$/.test(preview.src)
        || !isObject(preview.approval) || preview.approval.approvedBy !== 'owner'
        || typeof preview.approval.reviewedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(preview.approval.reviewedAt)
        || !Number.isFinite(Date.parse(preview.approval.reviewedAt))
        || new Date(preview.approval.reviewedAt).toISOString().slice(0, 10) !== preview.approval.reviewedAt
        || typeof preview.width !== 'number' || !Number.isInteger(preview.width) || preview.width < 320 || preview.width > 2400
        || typeof preview.height !== 'number' || !Number.isInteger(preview.height) || preview.height < 180 || preview.height > 1800) {
        throw new ValidationError('Project previews require an owner-approved local asset with valid dimensions.');
      }
      const previous = projectDimensions.get(preview.src);
      if (previous && (previous.width !== preview.width || previous.height !== preview.height)) {
        throw new ValidationError('Shared image references must agree on dimensions.');
      }
      projectDimensions.set(preview.src, { width: preview.width, height: preview.height });
      assets.set(preview.src, true);
    }
  }

  for (const item of recommendations) {
    if (!isObject(item)) throw new ValidationError('Invalid recommendation asset reference.');
    if (item.portrait === undefined) continue;
    const portrait = item.portrait;
    if (!isObject(portrait) || typeof portrait.src !== 'string'
      || !/^assets\/portraits\/[a-z0-9][a-z0-9._-]*\.webp$/.test(portrait.src)
      || !isObject(portrait.approval) || portrait.approval.approvedBy !== 'owner'
      || typeof portrait.approval.reviewedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(portrait.approval.reviewedAt)
      || !Number.isFinite(Date.parse(portrait.approval.reviewedAt))
      || new Date(portrait.approval.reviewedAt).toISOString().slice(0, 10) !== portrait.approval.reviewedAt
      || typeof portrait.width !== 'number' || !Number.isInteger(portrait.width) || portrait.width < 64 || portrait.width > 512
      || portrait.width !== portrait.height) {
      throw new ValidationError('Recommendation portraits require an owner-approved local square WebP.');
    }
    if (portraits.has(portrait.src)) throw new ValidationError('Recommendation portrait references must be unique.');
    assets.set(portrait.src, true);
    portraits.set(portrait.src, { width: portrait.width, height: portrait.width });
  }

  for (const [relative, preview] of assets) {
    const segments = relative.split('/');
    let source = path.resolve(sourceDir);
    for (const segment of segments) {
      source = path.join(source, segment);
      if ((await fs.lstat(source)).isSymbolicLink()) {
        throw new ValidationError('Public assets cannot contain symbolic links.');
      }
    }
    const stat = await fs.stat(source);
    if (!stat.isFile() || (preview && stat.size > 256_000)) {
      throw new ValidationError('Project previews must be regular assets no larger than 250 KB.');
    }
    const bytes = await fs.readFile(source);
    const portrait = portraits.get(relative);
    if (portrait) {
      const dimensions = webpDimensions(bytes);
      if (bytes.length > 50_000 || dimensions.width !== portrait.width || dimensions.height !== portrait.height) {
        throw new ValidationError('Portraits must match their declared dimensions and be no larger than 50 KB.');
      }
    }
    if (preview) {
      const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
      const avif = bytes.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(bytes.toString('ascii', 8, 40));
      if (!(relative.endsWith('.webp') ? webp : avif)) {
        throw new ValidationError('Project preview encoding does not match its WebP or AVIF extension.');
      }
      const expected = projectDimensions.get(relative);
      if (expected && webp) {
        const measured = webpDimensions(bytes);
        if (measured.width !== expected.width || measured.height !== expected.height) {
          throw new ValidationError('Project images must match their declared dimensions.');
        }
      }
    }
    const target = path.join(destination, ...segments);
    await ensureDir(path.dirname(target));
    await fs.writeFile(target, bytes);
  }
}

export async function verifyFrontendBudget(directory: string, limits: { main: number; architecture: number } = JAVASCRIPT_BUDGET) {
  const scripts = (await walkFiles(directory)).filter((file) => file.endsWith('.js'));
  const chunks = await Promise.all(scripts.map(async (file) => ({
    name: path.basename(file),
    gzipBytes: gzipSync(await fs.readFile(file)).byteLength,
    architecture: path.basename(file).startsWith('architecture-scene.')
  })));
  const main = chunks.filter((chunk) => !chunk.architecture).reduce((sum, chunk) => sum + chunk.gzipBytes, 0);
  const architecture = chunks.filter((chunk) => chunk.architecture).reduce((sum, chunk) => sum + chunk.gzipBytes, 0);
  const findings = [];
  if (main > limits.main) findings.push(`Main JavaScript: ${main} gzip bytes exceeds ${limits.main}.`);
  if (architecture > limits.architecture) findings.push(`Architecture chunk: ${architecture} gzip bytes exceeds ${limits.architecture}.`);
  if (findings.length) throw new ValidationError('Frontend JavaScript budget exceeded', findings);
  return { main, architecture, chunks };
}

export async function verifyLocalResources(directory: string) {
  const findings = [];
  for (const file of await walkFiles(directory)) {
    if (!/\.(?:html|css)$/.test(file)) continue;
    const source = await fs.readFile(file, 'utf8');
    const relative = path.relative(directory, file);
    const resources = source.match(/<(?:script|img|source|iframe|video|audio)\b[^>]*>|<link\b(?=[^>]*\brel="(?:stylesheet|preload|modulepreload|icon)")[^>]*>/gi) ?? [];
    if (resources.some((tag) => /(?:src|srcset|href)="(?:https?:)?\/\//i.test(tag))
      || /(?:url\(\s*["']?|@import\s*["'])(?:https?:)?\/\//i.test(source)) {
      findings.push(`${relative}: runtime resources must be local.`);
    }
  }
  if (findings.length) throw new ValidationError('External runtime resource found', findings);
}
