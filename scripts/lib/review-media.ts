import fs from 'node:fs/promises';
import path from 'node:path';
import type { CareerDataset, ReviewAsset, ReviewImage } from './model.ts';
import { ensureDir, isObject } from './files.ts';
import { auditObject, loadLocalPrivacyRules } from './privacy.ts';
import { ValidationError } from './validation.ts';

const FILE_NAME = /^[a-z0-9][a-z0-9._-]*\.webp$/;
const ASSET_PATH = /^assets\/review\/[a-z0-9][a-z0-9._-]*\.webp$/;
const MAX_BYTES = 256_000;

function fail(message: string): never {
  throw new ValidationError(`Review media: ${message}`);
}

function record(value: unknown, keys: string[], label: string, optional: string[] = []): Record<string, unknown> {
  if (!isObject(value) || Object.keys(value).some((key) => !keys.includes(key) && !optional.includes(key))
    || keys.some((key) => !(key in value))) fail(`${label} has missing or unexpected fields.`);
  return value;
}

function text(value: unknown, min: number, max: number, label: string): string {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) fail(`Invalid ${label}.`);
  return value;
}

function dimension(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) fail('Invalid image dimensions.');
  return value;
}

function date(value: unknown): string {
  const result = text(value, 10, 10, 'image date');
  const parsed = new Date(result);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) fail('Invalid image date.');
  return result;
}

function source(value: unknown): ReviewImage['source'] {
  if (!isObject(value)) fail('Invalid image source.');
  if (value.kind === 'owner-provided') {
    const input = record(value, ['kind', 'providedAt'], 'owner-provided source');
    return { kind: 'owner-provided', providedAt: date(input.providedAt) };
  }
  if (value.kind === 'local-capture') {
    const input = record(value, ['kind', 'capturedAt'], 'local-capture source');
    return { kind: 'local-capture', capturedAt: date(input.capturedAt) };
  }
  if (value.kind === 'project-asset') {
    const input = record(value, ['kind', 'collectedAt'], 'project-asset source');
    return { kind: 'project-asset', collectedAt: date(input.collectedAt) };
  }
  const input = record(value, ['kind', 'url', 'capturedAt'], 'web source');
  if (input.kind !== 'web') fail('Invalid image source kind.');
  // Withhold source locations in private review notes, never from the audit.
  if (input.url === null) return { kind: 'web', url: null, capturedAt: date(input.capturedAt) };
  const href = text(input.url, 8, 500, 'source URL');
  const url = new URL(href);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) fail('Use a public HTTPS source URL without credentials or queries.');
  return { kind: 'web', url: href, capturedAt: date(input.capturedAt) };
}

// Screenshots are stored as static WebP. Read the container ourselves so the
// private engine does not acquire an image-processing runtime dependency.
export function webpDimensions(bytes: Uint8Array): { width: number; height: number } {
  const data = Buffer.from(bytes);
  if (data.length < 30 || data.length > MAX_BYTES || data.toString('ascii', 0, 4) !== 'RIFF'
    || data.toString('ascii', 8, 12) !== 'WEBP' || data.readUInt32LE(4) + 8 !== data.length) {
    fail('Expected a valid WebP no larger than 250 KB.');
  }
  for (let offset = 12; offset + 8 <= data.length;) {
    const kind = data.toString('ascii', offset, offset + 4);
    const size = data.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (start + size > data.length) fail('Truncated WebP chunk.');
    if (kind === 'VP8X' && size >= 10) {
      if ((data[start] ?? 0) & 2) fail('Animated images are not screenshot previews.');
      return { width: data.readUIntLE(start + 4, 3) + 1, height: data.readUIntLE(start + 7, 3) + 1 };
    }
    if (kind === 'VP8 ' && size >= 10 && data.toString('hex', start + 3, start + 6) === '9d012a') {
      return { width: data.readUInt16LE(start + 6) & 0x3fff, height: data.readUInt16LE(start + 8) & 0x3fff };
    }
    if (kind === 'VP8L' && size >= 5 && data[start] === 0x2f) {
      const bits = data.readUInt32LE(start + 1);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    offset = start + size + (size % 2);
  }
  return fail('WebP dimensions could not be verified.');
}

async function readRegularFile(file: string): Promise<Buffer> {
  const absolute = path.resolve(file);
  const root = path.parse(absolute).root;
  let cursor = root;
  for (const segment of absolute.slice(root.length).split(path.sep)) {
    cursor = path.join(cursor, segment);
    if ((await fs.lstat(cursor)).isSymbolicLink()) fail('Symbolic links are not allowed.');
  }
  const info = await fs.stat(absolute);
  if (!info.isFile() || info.size > MAX_BYTES) fail('Expected a regular file no larger than 250 KB.');
  return fs.readFile(absolute);
}

export async function loadReviewMedia(directory: string, projectIds: ReadonlySet<string>, recommendationIds: ReadonlySet<string> = new Set()): Promise<{
  media: Record<string, ReviewImage[]>; portraits: Record<string, ReviewImage>; assets: ReviewAsset[];
}> {
  const manifest = path.join(directory, 'preview.json');
  let raw: unknown;
  try {
    raw = JSON.parse((await readRegularFile(manifest)).toString('utf8'));
  } catch (error) {
    if (isObject(error) && error.code === 'ENOENT') return { media: {}, portraits: {}, assets: [] };
    throw error;
  }
  const value = record(raw, ['schemaVersion', 'projects'], 'manifest', ['portraits']);
  if (value.schemaVersion !== 1 || !Array.isArray(value.projects)) fail('Invalid manifest version or projects.');
  const findings = auditObject(value, { source: 'review media', ...await loadLocalPrivacyRules() });
  if (findings.length) throw new ValidationError('Review media privacy audit failed', findings);

  const media: Record<string, ReviewImage[]> = {};
  const portraits: Record<string, ReviewImage> = {};
  const assets: ReviewAsset[] = [];
  const filenames = new Set<string>();

  async function readImage(input: unknown, portrait: boolean): Promise<ReviewImage> {
    const image = record(input, ['file', 'width', 'height', 'source', 'en', 'pt-BR'], 'image');
    const filename = text(image.file, 6, 100, 'filename');
    if (!FILE_NAME.test(filename) || filenames.has(filename)) fail('Unsafe or duplicate image filename.');
    filenames.add(filename);
    // Portraits do not relax the established project screenshot constraints.
    const width = dimension(image.width, portrait ? 64 : 320, portrait ? 512 : 2400);
    const height = dimension(image.height, portrait ? 64 : 180, portrait ? 512 : 1800);
    if (portrait && width !== height) fail('Portraits must be square.');
    const provenance = source(image.source);
    const en = record(image.en, ['alt', 'caption'], 'English image text');
    const pt = record(image['pt-BR'], ['alt', 'caption'], 'Portuguese image text');
    const bytes = await readRegularFile(path.join(directory, 'images', filename));
    if (portrait && bytes.length > 50_000) fail('Portraits must be no larger than 50 KB.');
    const measured = webpDimensions(bytes);
    if (measured.width !== width || measured.height !== height) fail('Declared dimensions do not match the image.');
    const src = `assets/review/${filename}`;
    assets.push({ src, bytes });
    return { src, width, height, source: provenance,
      alt: text(en.alt, 8, 240, 'English alternative text'),
      caption: text(en.caption, 8, 500, 'English caption'),
      localizations: { 'pt-BR': {
        alt: text(pt.alt, 8, 240, 'Portuguese alternative text'),
        caption: text(pt.caption, 8, 500, 'Portuguese caption')
      } }
    };
  }
  for (const item of value.projects) {
    const entry = record(item, ['projectId', 'images'], 'project');
    const projectId = text(entry.projectId, 1, 100, 'project ID');
    if (!projectIds.has(projectId) || Object.hasOwn(media, projectId)) fail('Unknown or duplicate project ID.');
    if (!Array.isArray(entry.images) || !entry.images.length || entry.images.length > 6) fail('Use one to six images per project.');
    const images: ReviewImage[] = [];
    for (const input of entry.images) {
      images.push(await readImage(input, false));
    }
    media[projectId] = images;
  }
  if ('portraits' in value) {
    if (!Array.isArray(value.portraits) || value.portraits.length > 12) fail('Use at most twelve recommendation portraits.');
    for (const item of value.portraits) {
      const entry = record(item, ['recommendationId', 'image'], 'portrait');
      const id = text(entry.recommendationId, 1, 100, 'recommendation ID');
      if (!recommendationIds.has(id) || Object.hasOwn(portraits, id)) fail('Unknown or duplicate recommendation ID.');
      portraits[id] = await readImage(entry.image, true);
    }
  }
  return { media, portraits, assets };
}

// Called by the build adapter with already validated bytes. This function never
// reads private storage and refuses to stage review images in a public build.
export async function stageReviewAssets(data: CareerDataset, assets: readonly ReviewAsset[], destination: string) {
  const references = [...Object.values(data.reviewMedia ?? {}).flat(), ...Object.values(data.reviewPortraits ?? {})];
  if ((data.reviewMedia !== undefined || data.reviewPortraits !== undefined || assets.length) && data.preview !== true) fail('Images awaiting review are preview-only.');
  const bySource = new Map(assets.map((asset) => [asset.src, asset.bytes]));
  if (bySource.size !== assets.length || references.length !== assets.length) fail('Review asset references and bytes must match.');
  for (const image of references) {
    if (!ASSET_PATH.test(image.src)) fail('Invalid review asset destination.');
    const bytes = bySource.get(image.src);
    if (!bytes) fail('Missing review image bytes.');
    bySource.delete(image.src);
    const measured = webpDimensions(bytes);
    if (measured.width !== image.width || measured.height !== image.height) fail('Review image dimensions do not match.');
    const target = path.join(destination, ...image.src.split('/'));
    await ensureDir(path.dirname(target));
    await fs.writeFile(target, bytes);
  }
}
