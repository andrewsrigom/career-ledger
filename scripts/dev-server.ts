#!/usr/bin/env node

import { errorMessage } from './lib/files.ts';
import { ValidationError } from './lib/validation.ts';

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { buildSite } from './lib/build.ts';
import { PATHS } from './lib/constants.ts';
import { normalizeBasePath, pathExists } from './lib/files.ts';
import { buildCandidatePreview } from './lib/preview.ts';

const previewMode = process.argv.includes('--preview');
const portArgument = process.argv.find((argument) => argument.startsWith('--port='))?.split('=', 2)[1];
const port = Number(portArgument ?? process.env.PORT ?? (previewMode ? 4322 : 4321));
const host = process.env.HOST ?? '127.0.0.1';
const basePath = normalizeBasePath(process.env.BASE_PATH ?? '');
const siteUrl = process.env.SITE_URL ?? `http://${host}:${port}`;
const outputDir = previewMode ? PATHS.publicationPreview : PATHS.dist;

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.avif', 'image/avif'],
  ['.webp', 'image/webp'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8']
]);

let building: Promise<Awaited<ReturnType<typeof buildSite>>> | null = null;
let queuedReason: string | null = null;
let rebuildTimer: ReturnType<typeof setTimeout> | undefined;
const watchers: fs.FSWatcher[] = [];

async function rebuild(reason = 'startup') {
  if (building) {
    queuedReason = reason;
    return building;
  }

  building = (async () => {
      let result;
      let currentReason: string | null = reason;
      do {
        queuedReason = null;
        result = await (previewMode
          ? buildCandidatePreview({ siteUrl, basePath })
          : buildSite({ siteUrl, basePath }));
        console.log(`[career] built ${result.files.length} files (${currentReason})`);
        currentReason = queuedReason;
      } while (currentReason);
      return result;
    })()
    .catch((error: unknown) => {
      console.error(`[career] build failed (${reason})`);
      console.error(error instanceof ValidationError ? error.issues.join('\n') : error instanceof Error ? error.stack : errorMessage(error));
      throw error;
    })
    .finally(() => {
      building = null;
    });

  return building;
}

function scheduleRebuild(reason: string) {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    rebuild(reason).catch(() => {});
  }, 120);
}

function watchDirectory(directory: string) {
  if (!fs.existsSync(directory)) return;
  try {
    const watcher = fs.watch(directory, { recursive: true }, (_event, filename) => {
      scheduleRebuild(filename ? `${path.basename(directory)}/${filename}` : path.basename(directory));
    });
    watchers.push(watcher);
  } catch (error) {
    console.warn(`[career] unable to watch ${directory}: ${errorMessage(error)}`);
  }
}

function stripBasePath(urlPath: string) {
  if (!basePath) return urlPath;
  if (urlPath === basePath) return '/';
  if (!urlPath.startsWith(`${basePath}/`)) return null;
  return urlPath.slice(basePath.length);
}

async function resolveRequest(urlPath: string) {
  const stripped = stripBasePath(urlPath);
  if (stripped === null) return null;

  let decoded;
  try {
    decoded = decodeURIComponent(stripped);
  } catch {
    return null;
  }

  const relative = decoded.replace(/^\/+/, '');
  const candidates = [];
  if (!relative) {
    candidates.push(path.join(outputDir, 'index.html'));
  } else if (relative.endsWith('/')) {
    candidates.push(path.join(outputDir, relative, 'index.html'));
  } else {
    candidates.push(path.join(outputDir, relative));
    if (!path.extname(relative)) {
      candidates.push(path.join(outputDir, relative, 'index.html'));
    }
  }

  for (const candidate of candidates) {
    const absolute = path.resolve(candidate);
    const relativeToDist = path.relative(outputDir, absolute);
    if (relativeToDist.startsWith('..') || path.isAbsolute(relativeToDist)) continue;
    if (await pathExists(absolute)) {
      const stat = await fsp.stat(absolute);
      if (stat.isFile()) return absolute;
    }
  }

  return null;
}

const server = http.createServer(async (request, response) => {
  try {
    if (building) await building;
    const requestUrl = new URL(request.url ?? '/', siteUrl);
    const file = await resolveRequest(requestUrl.pathname);

    if (!file) {
      const fallback = path.join(outputDir, '404.html');
      const body = await fsp.readFile(fallback);
      response.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      response.end(body);
      return;
    }

    const body = await fsp.readFile(file);
    response.writeHead(200, {
      'Content-Type': contentTypes.get(path.extname(file).toLowerCase()) ?? 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(body);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(`Build or server error: ${errorMessage(error)}\n`);
  }
});

await rebuild();
for (const directory of [
  PATHS.publicContent,
  path.join(PATHS.root, 'src'),
  path.join(PATHS.root, 'public'),
  ...(previewMode ? [PATHS.candidates, PATHS.activities, path.join(PATHS.careerPrivate, 'media-review')] : [])
]) {
  watchDirectory(directory);
}

server.listen(port, host, () => {
  console.log(`[career] local ${previewMode ? 'private review' : 'public'} site: ${siteUrl}${basePath || ''}/`);
  console.log('[career] watching content, Astro source, and approved assets; restart after Node tooling changes');
});

function shutdown() {
  clearTimeout(rebuildTimer);
  for (const watcher of watchers) watcher.close();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
