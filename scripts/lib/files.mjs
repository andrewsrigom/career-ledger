import fs from 'node:fs/promises';
import path from 'node:path';

export async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true });
}

export async function readJson(target) {
  const source = await fs.readFile(target, 'utf8');
  try {
    return JSON.parse(source);
  } catch (error) {
    error.message = `Invalid JSON in ${target}: ${error.message}`;
    throw error;
  }
}

export async function writeJson(target, value) {
  await ensureDir(path.dirname(target));
  const temporary = `${target}.${process.pid}.tmp`;
  const source = `${JSON.stringify(value, null, 2)}\n`;
  await fs.writeFile(temporary, source, 'utf8');
  await fs.rename(temporary, target);
}

export async function writeText(target, value) {
  await ensureDir(path.dirname(target));
  const temporary = `${target}.${process.pid}.tmp`;
  await fs.writeFile(temporary, value, 'utf8');
  await fs.rename(temporary, target);
}

export async function listJsonFiles(directory) {
  if (!(await pathExists(directory))) {
    return [];
  }

  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(directory, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

export async function walkFiles(directory, options = {}) {
  const { skip = () => false } = options;
  const results = [];

  if (!(await pathExists(directory))) {
    return results;
  }

  async function visit(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(directory, absolute).split(path.sep).join('/');

      if (skip(relative, entry)) {
        continue;
      }

      if (entry.isSymbolicLink()) {
        continue;
      }

      if (entry.isDirectory()) {
        await visit(absolute);
      } else if (entry.isFile()) {
        results.push(absolute);
      }
    }
  }

  await visit(directory);
  return results;
}

export async function copyDirectory(source, destination, options = {}) {
  if (!(await pathExists(source))) {
    return;
  }

  const files = await walkFiles(source, options);
  for (const file of files) {
    const relative = path.relative(source, file);
    const target = path.join(destination, relative);
    await ensureDir(path.dirname(target));
    await fs.copyFile(file, target);
  }
}

export async function removeDirectory(target) {
  await fs.rm(target, { recursive: true, force: true });
}

export function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

export function normalizeBasePath(value = '') {
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

export function normalizeSiteUrl(value = '') {
  const trimmed = String(value).trim().replace(/\/+$/g, '');
  return trimmed || 'http://localhost:4321';
}

export function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

export function timestampForPath(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

export function compareIsoDescending(a, b) {
  return String(b).localeCompare(String(a));
}

export async function countFiles(directory, predicate = () => true) {
  const files = await walkFiles(directory);
  return files.filter(predicate).length;
}
