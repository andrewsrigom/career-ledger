import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { ensureDir, walkFiles, isObject } from './files.ts';
import { ValidationError } from './validation.ts';

export const JAVASCRIPT_BUDGET = Object.freeze({ main: 90_000, architecture: 180_000 });

export async function stagePublicAssets(projects: readonly unknown[], sourceDir: string, destination: string) {
  if ((await fs.lstat(sourceDir)).isSymbolicLink()) {
    throw new ValidationError('The public asset directory cannot be a symbolic link.');
  }
  // Do not give Astro the repository's whole public directory. Only the site
  // icon and explicitly reviewed project visuals become build inputs.
  const assets = new Map<string, boolean>([['assets/favicon.svg', false]]);
  for (const project of projects) {
    if (!isObject(project)) throw new ValidationError('Invalid project asset reference.');
    if (project.presentation === undefined) continue;
    if (!isObject(project.presentation) || !isObject(project.presentation.preview)) throw new ValidationError('Invalid project presentation.');
    const preview = project.presentation.preview;
    if (preview.kind !== 'image') continue;
    if (typeof preview.src !== 'string' || !/^assets\/projects\/[a-z0-9][a-z0-9._-]*\.(?:avif|webp)$/.test(preview.src)
      || !isObject(preview.approval) || preview.approval.approvedBy !== 'owner' || typeof preview.approval.reviewedAt !== 'string' || !preview.approval.reviewedAt) {
      throw new ValidationError('Project previews require an owner-approved local asset.');
    }
    assets.set(preview.src, true);
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
    if (preview) {
      const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
      const avif = bytes.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(bytes.toString('ascii', 8, 40));
      if (!(relative.endsWith('.webp') ? webp : avif)) {
        throw new ValidationError('Project preview encoding does not match its WebP or AVIF extension.');
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
