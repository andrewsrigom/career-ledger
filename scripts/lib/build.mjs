import fs from 'node:fs/promises';
import path from 'node:path';
import { PATHS } from './constants.mjs';
import { createPublicDataset } from './content.mjs';
import {
  copyDirectory,
  ensureDir,
  normalizeBasePath,
  normalizeSiteUrl,
  removeDirectory,
  toPosixPath,
  walkFiles,
  writeJson,
  writeText
} from './files.mjs';
import { auditGeneratedDirectory, auditPublicFiles } from './privacy.mjs';
import {
  renderAbout,
  renderArea,
  renderAreas,
  renderEntry,
  renderFeed,
  renderHome,
  renderManifest,
  renderNotFound,
  renderProject,
  renderProjects,
  renderRobots,
  renderSitemap,
  renderTimeline
} from './render.mjs';
import { createUrlContext } from './url.mjs';
import { ValidationError } from './validation.mjs';

const HTML_REFERENCE = /(?:href|src)="([^"]+)"/g;

function routeToFile(distDir, route) {
  if (!route) return path.join(distDir, 'index.html');
  if (route.endsWith('.html')) return path.join(distDir, route);
  return path.join(distDir, route, 'index.html');
}

async function writeRoute(distDir, route, source) {
  await writeText(routeToFile(distDir, route), `${source}\n`);
}

function stripQueryAndHash(value) {
  return value.split('#', 1)[0].split('?', 1)[0];
}

function isExternalReference(value) {
  return /^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(value);
}

function referenceToTarget(reference, basePath, distDir) {
  const clean = decodeURIComponent(stripQueryAndHash(reference));
  if (!clean || isExternalReference(clean)) return null;

  const normalizedBase = normalizeBasePath(basePath);
  let publicPath = clean;

  if (publicPath.startsWith('/')) {
    if (normalizedBase && publicPath !== normalizedBase && !publicPath.startsWith(`${normalizedBase}/`)) {
      return { error: `root-relative reference does not start with configured base path "${normalizedBase}"` };
    }
    publicPath = normalizedBase ? publicPath.slice(normalizedBase.length) : publicPath;
  }

  publicPath = publicPath.replace(/^\/+/, '');
  if (!publicPath) return { target: path.join(distDir, 'index.html') };

  if (publicPath.endsWith('/')) {
    return { target: path.join(distDir, publicPath, 'index.html') };
  }

  const extension = path.extname(publicPath);
  if (!extension) {
    return { target: path.join(distDir, publicPath, 'index.html') };
  }

  return { target: path.join(distDir, publicPath) };
}

export async function verifyGeneratedLinks(distDir, options = {}) {
  const { basePath = '' } = options;
  const files = await walkFiles(distDir);
  const findings = [];

  for (const file of files.filter((item) => path.extname(item).toLowerCase() === '.html')) {
    const source = await fs.readFile(file, 'utf8');
    const relative = toPosixPath(path.relative(distDir, file));
    const references = [...source.matchAll(HTML_REFERENCE)].map((match) => match[1]);

    for (const reference of references) {
      const resolved = referenceToTarget(reference, basePath, distDir);
      if (!resolved) continue;
      if (resolved.error) {
        findings.push(`${relative}: ${reference}: ${resolved.error}`);
        continue;
      }
      try {
        await fs.access(resolved.target);
      } catch {
        findings.push(`${relative}: ${reference}: target does not exist (${toPosixPath(path.relative(distDir, resolved.target))})`);
      }
    }
  }

  return [...new Set(findings)].sort();
}

export async function publishPublicDataset(options = {}) {
  const { destination = path.join(PATHS.dist, 'data', 'career.json') } = options;
  const findings = await auditPublicFiles({ includeLocalRules: false });
  if (findings.length) {
    throw new ValidationError('Public privacy audit failed', findings);
  }

  const data = await createPublicDataset();
  await writeJson(destination, data);
  return { data, destination };
}

export async function buildSite(options = {}) {
  const distDir = options.distDir ?? PATHS.dist;
  const siteUrl = normalizeSiteUrl(options.siteUrl ?? process.env.SITE_URL ?? 'http://localhost:4321');
  const basePath = normalizeBasePath(options.basePath ?? process.env.BASE_PATH ?? '');

  const publicFindings = await auditPublicFiles({ includeLocalRules: false });
  if (publicFindings.length) {
    throw new ValidationError('Public privacy audit failed', publicFindings);
  }

  const data = await createPublicDataset();
  const urls = createUrlContext({ siteUrl, basePath });

  await removeDirectory(distDir);
  await ensureDir(distDir);
  await copyDirectory(PATHS.siteAssets, path.join(distDir, 'assets'));
  await copyDirectory(PATHS.siteStatic, distDir, {
    skip: (relative) => path.basename(relative) === '.gitkeep'
  });

  await writeRoute(distDir, '', renderHome(data, urls));
  await writeRoute(distDir, 'timeline/', renderTimeline(data, urls));
  await writeRoute(distDir, 'areas/', renderAreas(data, urls));
  await writeRoute(distDir, 'projects/', renderProjects(data, urls));
  await writeRoute(distDir, 'about/', renderAbout(data, urls));
  await writeRoute(distDir, '404.html', renderNotFound(data, urls));

  for (const area of data.taxonomy.areas) {
    await writeRoute(distDir, `areas/${area.slug}/`, renderArea(data, urls, area));
  }

  for (const entry of data.entries) {
    await writeRoute(distDir, `entries/${entry.slug}/`, renderEntry(data, urls, entry));
  }

  for (const project of data.projects) {
    await writeRoute(distDir, `projects/${project.slug}/`, renderProject(data, urls, project));
  }

  await writeJson(path.join(distDir, 'data', 'career.json'), data);
  await writeText(path.join(distDir, 'sitemap.xml'), renderSitemap(data, urls));
  await writeText(path.join(distDir, 'feed.xml'), renderFeed(data, urls));
  await writeText(path.join(distDir, 'robots.txt'), renderRobots(urls));
  await writeText(path.join(distDir, 'manifest.webmanifest'), renderManifest(data, urls));
  await writeText(path.join(distDir, '.nojekyll'), '');

  const linkFindings = await verifyGeneratedLinks(distDir, { basePath });
  if (linkFindings.length) {
    throw new ValidationError('Generated link verification failed', linkFindings);
  }

  const generatedFindings = await auditGeneratedDirectory(distDir);
  if (generatedFindings.length) {
    throw new ValidationError('Generated site privacy audit failed', generatedFindings);
  }

  const files = await walkFiles(distDir);
  return {
    data,
    distDir,
    siteUrl,
    basePath,
    files: files.map((file) => toPosixPath(path.relative(distDir, file)))
  };
}
