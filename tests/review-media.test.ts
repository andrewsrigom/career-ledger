import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, { type TestContext } from 'node:test';
import { loadReviewMedia, stageReviewAssets, webpDimensions } from '../scripts/lib/review-media.ts';
import { createPublicDataset } from '../scripts/lib/content.ts';
import { validateProject } from '../scripts/lib/validation.ts';
import { first, REVIEW_WEBP, reviewMediaFixture, PORTRAIT_WEBP, portraitFixture } from './helpers.ts';
import { localizeCareerDataset } from '../scripts/lib/i18n.ts';

async function workspace(context: TestContext) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'career-review-media-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  await fs.mkdir(path.join(directory, 'images'));
  await fs.writeFile(path.join(directory, 'images', 'sample.webp'), REVIEW_WEBP);
  const manifest = reviewMediaFixture('career-ledger');
  async function save(value: unknown = manifest) {
    await fs.writeFile(path.join(directory, 'preview.json'), JSON.stringify(value));
  }
  await save();
  return { directory, manifest, save };
}

test('review portraits use a separate bounded identity map and remain preview-only', async context => {
  const { directory, manifest, save } = await workspace(context);
  const portrait = portraitFixture();
  await fs.writeFile(path.join(directory, 'images', portrait.image.file), PORTRAIT_WEBP);
  await save({ ...manifest, portraits: [portrait] });
  const ids = new Set([portrait.recommendationId]);
  const result = await loadReviewMedia(directory, new Set(['career-ledger']), ids);
  assert.equal(result.assets.length, 2);
  assert.deepEqual(webpDimensions(result.assets[1]!.bytes), { width: 100, height: 100 });
  const data = await createPublicDataset();
  const destination = path.join(directory, 'portrait-output');
  await assert.rejects(stageReviewAssets({ ...data, reviewPortraits: {} }, [], destination), /preview-only/);
  await assert.rejects(stageReviewAssets({ ...data, reviewPortraits: result.portraits }, result.assets.slice(1), destination), /preview-only/);
  const preview = { ...data, preview: true as const, reviewMedia: result.media, reviewPortraits: result.portraits };
  await assert.rejects(stageReviewAssets(preview, [], destination), /must match/);
  await assert.rejects(stageReviewAssets(preview, [...result.assets, result.assets[1]!], destination), /must match/);
  await stageReviewAssets(preview, result.assets, destination);
  assert.equal(localizeCareerDataset(preview, 'pt-BR').reviewPortraits![portrait.recommendationId]!.alt, portrait.image['pt-BR'].alt);
  assert.deepEqual(await fs.readFile(path.join(destination, 'assets', 'review', 'colleague.webp')), PORTRAIT_WEBP);
  await assert.rejects(loadReviewMedia(directory, new Set(['career-ledger'])), /recommendation ID/);
});

test('portrait support does not relax project dimensions, metadata, or path constraints', async context => {
  const { directory, manifest, save } = await workspace(context);
  const portrait = portraitFixture();
  const image = portrait.image;
  await fs.writeFile(path.join(directory, 'images', image.file), PORTRAIT_WEBP);
  const ids = new Set([portrait.recommendationId]);
  const projects = new Set(['career-ledger']);
  for (const portraits of [null, {}, [portrait, portrait], [{ ...portrait, recommendationId: 'unknown' }],
    ...[{ ...image, width: 101 }, { ...image, width: 63, height: 63 }, { ...image, file: '../outside.webp' }, { ...image, approval: { approvedBy: 'owner' } }, { ...image, 'pt-BR': undefined }].map(value => [{ ...portrait, image: value }])]) {
    await save({ ...manifest, portraits });
    await assert.rejects(loadReviewMedia(directory, projects, ids));
  }
  await save({ schemaVersion: 1, projects: [{ projectId: 'career-ledger', images: [image] }] });
  await assert.rejects(loadReviewMedia(directory, projects), /dimensions/);
  await save({ ...manifest, portraits: [portrait] });
  await fs.writeFile(path.join(directory, 'images', image.file), Buffer.alloc(50_001));
  await assert.rejects(loadReviewMedia(directory, projects, ids), /50 KB/);
  await fs.rename(path.join(directory, 'images', image.file), path.join(directory, 'original.webp'));
  await fs.symlink(path.join(directory, 'original.webp'), path.join(directory, 'images', image.file));
  await assert.rejects(loadReviewMedia(directory, projects, ids), /Symbolic links/);
});

test('review media keeps image provenance and localized text without fabricating approval', async (context) => {
  const { directory, manifest, save } = await workspace(context);
  const result = await loadReviewMedia(directory, new Set(['career-ledger']));
  const image = first(result.media['career-ledger'] ?? []);
  assert.equal(image.src, 'assets/review/sample.webp');
  assert.equal(image.localizations?.['pt-BR'].alt, first(first(manifest.projects).images)['pt-BR'].alt);
  assert.equal('approval' in image, false);
  assert.deepEqual(webpDimensions(first(result.assets).bytes), { width: 320, height: 180 });

  const ownerSource = structuredClone(manifest);
  const ownerImage = { ...first(first(ownerSource.projects).images), source: { kind: 'owner-provided', providedAt: '2026-08-27' } };
  await save({ schemaVersion: 1, projects: [{ projectId: 'career-ledger', images: [ownerImage] }] });
  const ownerResult = await loadReviewMedia(directory, new Set(['career-ledger']));
  assert.deepEqual(first(ownerResult.media['career-ledger'] ?? []).source, { kind: 'owner-provided', providedAt: '2026-08-27' });
});

test('review media rejects invalid references, metadata, encoding, sizes and private text', async (context) => {
  const { directory, manifest, save } = await workspace(context);
  const project = first(manifest.projects);
  const original = first(project.images);
  const variants: unknown[] = [
    { ...original, file: '../outside.webp' },
    { ...original, width: 321 },
    { ...original, height: 0 },
    { ...original, 'pt-BR': undefined },
    { ...original, approval: { approvedBy: 'owner' } },
    { ...original, source: { kind: 'web', url: 'http://example.com/', capturedAt: '2026-08-27' } },
    { ...original, source: { kind: 'web', url: 'https://example.com/?token=secret', capturedAt: '2026-08-27' } },
    { ...original, source: { kind: 'web', capturedAt: '2026-08-27' } },
    { ...original, source: { kind: 'web', url: '', capturedAt: '2026-08-27' } },
    { ...original, source: { kind: 'web', url: null, capturedAt: '2026-02-30' } },
    { ...original, source: { kind: 'owner-provided', providedAt: '2026-02-30' } },
    { ...original, source: { kind: 'local-capture', capturedAt: '2026-02-30' } },
    { ...original, source: { kind: 'local-capture', capturedAt: '2026-08-27', url: 'http://127.0.0.1:3000/' } },
    { ...original, source: { kind: 'local-capture', providedAt: '2026-08-27' } },
    { ...original, source: { kind: 'project-asset', collectedAt: '2026-08-32' } },
    { ...original, source: { kind: 'project-asset', capturedAt: '2026-08-27' } },
    { ...original, source: { kind: 'project-asset', collectedAt: '2026-08-27', sourcePath: 'docs/screenshot.png' } },
    { ...original, source: { kind: 'project-asset', collectedAt: '2026-08-27', url: 'https://example.com/' } },
    { ...original, source: { kind: 'unknown', url: 'https://example.com/', capturedAt: '2026-08-27' } },
    // Build a synthetic unsafe path at test runtime, never a real local path
    // in the staged source. The same input must still fail the media audit.
    { ...original, en: { ...original.en, caption: `Original image from ${['', 'home', 'person', 'private', 'customer'].join('/')}.` } }
  ];
  for (const value of variants) {
    await save({ schemaVersion: 1, projects: [{ projectId: 'career-ledger', images: [value] }] });
    await assert.rejects(loadReviewMedia(directory, new Set(['career-ledger'])));
  }
  await save();
  await assert.rejects(loadReviewMedia(directory, new Set(['another-project'])), /Unknown or duplicate/);
  await save({ ...manifest, projects: [project, project] });
  await assert.rejects(loadReviewMedia(directory, new Set(['career-ledger'])), /Unknown or duplicate/);
  await save();
  for (const bytes of [Buffer.from('<svg/>'), Buffer.alloc(256_001)]) {
    await fs.writeFile(path.join(directory, 'images', 'sample.webp'), bytes);
    await assert.rejects(loadReviewMedia(directory, new Set(['career-ledger'])), /WebP|250 KB/);
  }
});

test('web captures may withhold source links without bypassing URL auditing or public isolation', async (context) => {
  const { directory, manifest, save } = await workspace(context);
  const original = first(first(manifest.projects).images);
  const provenance = { kind: 'web', url: null, capturedAt: '2026-08-27' };
  await save({ schemaVersion: 1, projects: [{ projectId: 'career-ledger', images: [{ ...original, source: provenance }] }] });
  const result = await loadReviewMedia(directory, new Set(['career-ledger']));
  assert.deepEqual(first(result.media['career-ledger'] ?? []).source, provenance);
  const destination = path.join(directory, 'public-output');
  await assert.rejects(stageReviewAssets({ ...await createPublicDataset(), reviewMedia: result.media }, result.assets, destination), /preview-only/);
  await assert.rejects(fs.access(destination));

  const privateUrl = ['https://', 'tenant', '.internal/'].join('');
  await save({ schemaVersion: 1, projects: [{ projectId: 'career-ledger', images: [{ ...original, source: { ...provenance, url: privateUrl } }] }] });
  await assert.rejects(loadReviewMedia(directory, new Set(['career-ledger'])), /privacy audit failed/);
});

test('local captures and project assets retain distinct dates without exposing their locations', async (context) => {
  const { directory, manifest, save } = await workspace(context);
  const original = first(first(manifest.projects).images);
  for (const provenance of [
    { kind: 'local-capture', capturedAt: '2026-08-27' },
    { kind: 'project-asset', collectedAt: '2026-08-27' }
  ]) {
    await save({ schemaVersion: 1, projects: [{ projectId: 'career-ledger', images: [{ ...original, source: provenance }] }] });
    const result = await loadReviewMedia(directory, new Set(['career-ledger']));
    assert.deepEqual(first(result.media['career-ledger'] ?? []).source, provenance);
    assert.doesNotMatch(JSON.stringify(result.media), /approval|sourcePath|localhost|127\.0\.0\.1/);
    const destination = path.join(directory, 'public-output');
    await assert.rejects(stageReviewAssets({ ...await createPublicDataset(), reviewMedia: result.media }, result.assets, destination), /preview-only/);
    await assert.rejects(fs.access(destination));
  }
});

test('review media never follows image symlinks', async (context) => {
  const { directory } = await workspace(context);
  const source = path.join(directory, 'images', 'sample.webp');
  await fs.rename(source, path.join(directory, 'original.webp'));
  await fs.symlink(path.join(directory, 'original.webp'), source);
  await assert.rejects(loadReviewMedia(directory, new Set(['career-ledger'])), /Symbolic links/);
});

test('review bytes only stage for isolated previews and cannot become a public project field', async (context) => {
  const { directory } = await workspace(context);
  const review = await loadReviewMedia(directory, new Set(['career-ledger']));
  const data = await createPublicDataset();
  const destination = path.join(directory, 'staged');
  await assert.rejects(stageReviewAssets({ ...data, reviewMedia: review.media }, review.assets, destination), /preview-only/);
  await assert.rejects(stageReviewAssets(data, review.assets, destination), /preview-only/);
  await assert.rejects(fs.access(destination));
  const preview = { ...data, preview: true as const, reviewMedia: review.media };
  await assert.rejects(stageReviewAssets(preview, [], destination), /must match/);
  await stageReviewAssets(preview, review.assets, destination);
  assert.deepEqual(await fs.readFile(path.join(destination, 'assets', 'review', 'sample.webp')), REVIEW_WEBP);
  const project = first(data.projects);
  assert.ok(validateProject({ ...project, reviewMedia: review.media }, { source: 'project', mode: 'public' }).length > 0);
  assert.ok(validateProject({ ...project, presentation: { preview: first(review.media['career-ledger'] ?? []) } }, { source: 'project', mode: 'public' }).length > 0);
});
