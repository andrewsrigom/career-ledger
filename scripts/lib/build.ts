import type { CareerDataset } from './model.ts';
import type { UrlContext } from './url.ts';
export interface BuildOptions { distDir?: string; siteUrl?: string; basePath?: string; data?: CareerDataset; includeLocalRules?: boolean; logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent'; }

import fs from 'node:fs/promises';
import path from 'node:path';
import { PATHS } from './constants.ts';
import { createPublicDataset } from './content.ts';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, localizeCareerDataset } from './i18n.ts';
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
} from './files.ts';
import { auditGeneratedDirectory, auditPublicFiles } from './privacy.ts';
import {
  renderFeed,
  renderManifest,
  renderRobots,
  renderSitemap
} from './render.ts';
import { createUrlContext } from './url.ts';
import { ValidationError } from './validation.ts';
import { stagePublicAssets, verifyFrontendBudget, verifyLocalResources } from './frontend-guards.ts';

const HTML_REFERENCE = /(?:href|src)="([^"]+)"/g;

function localeFile(distDir: string, urls: UrlContext, ...segments: string[]) {
  return path.join(distDir, ...(urls.routePrefix ? [urls.routePrefix] : []), ...segments);
}

function stripQueryAndHash(value: string) {
  return value.split(/[?#]/, 1)[0] ?? '';
}

function isExternalReference(value: string) {
  return /^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(value);
}

function referenceToTarget(reference: string, basePath: string, distDir: string) {
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

export async function verifyGeneratedLinks(distDir: string, options: { basePath?: string } = {}) {
  const { basePath = '' } = options;
  const files = await walkFiles(distDir);
  const findings = [];

  for (const file of files.filter((item) => path.extname(item).toLowerCase() === '.html')) {
    const source = await fs.readFile(file, 'utf8');
    const relative = toPosixPath(path.relative(distDir, file));
    const references = [...source.matchAll(HTML_REFERENCE)].map((match) => match[1] ?? '');

    for (const reference of references) {
      const resolved = referenceToTarget(reference, basePath, distDir);
      if (!resolved) continue;
      if ('error' in resolved) {
        findings.push(`${relative}: ${reference}: ${resolved.error}`);
        continue;
      }
      try {
        const stat = await fs.stat(resolved.target);
        if (!stat.isFile()) findings.push(`${relative}: ${reference}: target is not a file`);
      } catch {
        findings.push(`${relative}: ${reference}: target does not exist (${toPosixPath(path.relative(distDir, resolved.target))})`);
      }
    }
  }

  return [...new Set(findings)].sort();
}

export async function publishPublicDataset(options: { destination?: string } = {}) {
  const { destination = path.join(PATHS.dist, 'data', 'career.json') } = options;
  const findings = await auditPublicFiles({ includeLocalRules: false });
  if (findings.length) {
    throw new ValidationError('Public privacy audit failed', findings);
  }

  const data = localizeCareerDataset(await createPublicDataset(), DEFAULT_LOCALE);
  await writeJson(destination, data);
  return { data, destination };
}

export async function buildSite(options: BuildOptions = {}) {
  const distDir = options.distDir ?? PATHS.dist;
  const siteUrl = normalizeSiteUrl(options.siteUrl ?? process.env.SITE_URL ?? 'http://localhost:4321');
  const basePath = normalizeBasePath(options.basePath ?? process.env.BASE_PATH ?? '');

  const publicFindings = await auditPublicFiles({ includeLocalRules: false });
  if (publicFindings.length) {
    throw new ValidationError('Public privacy audit failed', publicFindings);
  }

  const sourceData = options.data ?? await createPublicDataset();
  if (options.data && sourceData.preview !== true) {
    throw new ValidationError('Injected build data is reserved for isolated candidate previews.');
  }
  const relativeToPublicOutput = path.relative(PATHS.dist, path.resolve(distDir));
  if (sourceData.preview && (!relativeToPublicOutput || (!relativeToPublicOutput.startsWith('..') && !path.isAbsolute(relativeToPublicOutput)))) {
    throw new ValidationError('Candidate previews cannot be written into public dist output.');
  }

  const localizedSites = SUPPORTED_LOCALES.map((locale) => ({
    locale,
    data: localizeCareerDataset(sourceData, locale.code),
    urls: createUrlContext({ siteUrl, basePath, locale: locale.code })
  }));

  await ensureDir(PATHS.tmp);
  const buildDirectory = await fs.mkdtemp(path.join(PATHS.tmp, 'astro-build-'));
  const inputPath = path.join(buildDirectory, 'dataset.json');
  const astroOutputDir = path.join(buildDirectory, 'output');
  const stagedAssets = path.join(buildDirectory, 'public');
  await writeJson(inputPath, sourceData);
  const previousEnvironment = {
    CAREER_BUILD_DATA_PATH: process.env.CAREER_BUILD_DATA_PATH,
    SITE_URL: process.env.SITE_URL,
    BASE_PATH: process.env.BASE_PATH,
    ASTRO_TELEMETRY_DISABLED: process.env.ASTRO_TELEMETRY_DISABLED
  };

  process.env.CAREER_BUILD_DATA_PATH = inputPath;
  process.env.SITE_URL = siteUrl;
  process.env.BASE_PATH = basePath;
  process.env.ASTRO_TELEMETRY_DISABLED = '1';

  try {
    await stagePublicAssets(sourceData.projects, path.join(PATHS.root, 'public'), stagedAssets);
    const { build: buildAstro } = await import('astro');
    await buildAstro({
      root: PATHS.root,
      outDir: astroOutputDir,
      publicDir: stagedAssets,
      cacheDir: path.join(buildDirectory, 'astro-cache'),
      site: siteUrl,
      base: basePath || '/',
      vite: { cacheDir: path.join(buildDirectory, 'vite-cache') },
      logLevel: options.logLevel ?? 'silent'
    });
    // Astro's directory format special-cases only the root 404 route. Preserve
    // the established localized 404.html URL as a file, not a directory.
    for (const locale of SUPPORTED_LOCALES.filter((item) => item.routePrefix)) {
      const localizedNotFound = path.join(astroOutputDir, locale.routePrefix, '404.html');
      const html = await fs.readFile(path.join(localizedNotFound, 'index.html'), 'utf8');
      await fs.rm(localizedNotFound, { recursive: true, force: true });
      await writeText(localizedNotFound, html);
    }
    await copyDirectory(PATHS.siteStatic, astroOutputDir, {
      skip: (relative) => relative !== 'CNAME'
    });

    for (const { data, urls } of localizedSites) {
      await writeJson(localeFile(astroOutputDir, urls, 'data', 'career.json'), data);
      await writeText(localeFile(astroOutputDir, urls, 'feed.xml'), renderFeed(data, urls));
      await writeText(localeFile(astroOutputDir, urls, 'manifest.webmanifest'), renderManifest(data, urls));
    }

    const defaultSite = localizedSites.find((site) => site.locale.code === DEFAULT_LOCALE) ?? localizedSites[0];
    if (!defaultSite) throw new Error('The default site locale is missing.');
    await writeText(path.join(astroOutputDir, 'sitemap.xml'), renderSitemap(defaultSite.data, localizedSites.map((site) => site.urls)));
    await writeText(path.join(astroOutputDir, 'robots.txt'), sourceData.preview ? 'User-agent: *\nDisallow: /\n' : renderRobots(defaultSite.urls));
    await writeText(path.join(astroOutputDir, '.nojekyll'), '');

    const linkFindings = await verifyGeneratedLinks(astroOutputDir, { basePath });
    if (linkFindings.length) throw new ValidationError('Generated link verification failed', linkFindings);

    const generatedFindings = await auditGeneratedDirectory(astroOutputDir, {
      includeLocalRules: options.includeLocalRules === true
    });
    if (generatedFindings.length) throw new ValidationError('Generated site privacy audit failed', generatedFindings);

    await verifyLocalResources(astroOutputDir);
    const javascript = await verifyFrontendBudget(astroOutputDir);
    const files = await walkFiles(astroOutputDir);
    // Only a complete, audited build may replace the last local output.
    await removeDirectory(distDir);
    await copyDirectory(astroOutputDir, distDir);
    return {
      data: defaultSite.data,
      localizedData: Object.fromEntries(localizedSites.map((site) => [site.locale.code, site.data])),
      distDir,
      siteUrl,
      basePath,
      javascript,
      files: files.map((file) => toPosixPath(path.relative(astroOutputDir, file)))
    };
  } finally {
    await fs.rm(buildDirectory, { recursive: true, force: true });
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}
