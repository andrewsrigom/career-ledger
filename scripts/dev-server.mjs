#!/usr/bin/env node

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { buildSite } from './lib/build.mjs';
import { PATHS } from './lib/constants.mjs';
import { normalizeBasePath, pathExists } from './lib/files.mjs';

const port = Number(process.env.PORT ?? 4321);
const host = process.env.HOST ?? '127.0.0.1';
const basePath = normalizeBasePath(process.env.BASE_PATH ?? '');
const siteUrl = process.env.SITE_URL ?? `http://${host}:${port}`;

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8']
]);

let building = null;
let rebuildTimer = null;
const watchers = [];

async function rebuild(reason = 'startup') {
  if (building) {
    await building;
  }

  building = buildSite({ siteUrl, basePath })
    .then((result) => {
      console.log(`[career] built ${result.files.length} files (${reason})`);
      return result;
    })
    .catch((error) => {
      console.error(`[career] build failed (${reason})`);
      console.error(error.issues?.join('\n') || error.stack || error.message);
      throw error;
    })
    .finally(() => {
      building = null;
    });

  return building;
}

function scheduleRebuild(reason) {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    rebuild(reason).catch(() => {});
  }, 120);
}

function watchDirectory(directory) {
  if (!fs.existsSync(directory)) return;
  try {
    const watcher = fs.watch(directory, { recursive: true }, (_event, filename) => {
      scheduleRebuild(filename ? `${path.basename(directory)}/${filename}` : path.basename(directory));
    });
    watchers.push(watcher);
  } catch (error) {
    console.warn(`[career] unable to watch ${directory}: ${error.message}`);
  }
}

function stripBasePath(urlPath) {
  if (!basePath) return urlPath;
  if (urlPath === basePath) return '/';
  if (!urlPath.startsWith(`${basePath}/`)) return null;
  return urlPath.slice(basePath.length);
}

async function resolveRequest(urlPath) {
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
    candidates.push(path.join(PATHS.dist, 'index.html'));
  } else if (relative.endsWith('/')) {
    candidates.push(path.join(PATHS.dist, relative, 'index.html'));
  } else {
    candidates.push(path.join(PATHS.dist, relative));
    if (!path.extname(relative)) {
      candidates.push(path.join(PATHS.dist, relative, 'index.html'));
    }
  }

  for (const candidate of candidates) {
    const absolute = path.resolve(candidate);
    const relativeToDist = path.relative(PATHS.dist, absolute);
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
      const fallback = path.join(PATHS.dist, '404.html');
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
    response.end(`Build or server error: ${error.message}\n`);
  }
});

await rebuild();
for (const directory of [PATHS.publicContent, PATHS.site, path.join(PATHS.root, 'scripts')]) {
  watchDirectory(directory);
}

server.listen(port, host, () => {
  console.log(`[career] local site: ${siteUrl}${basePath || ''}/`);
  console.log('[career] watching public content, site assets, and generator scripts');
});

function shutdown() {
  clearTimeout(rebuildTimer);
  for (const watcher of watchers) watcher.close();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
