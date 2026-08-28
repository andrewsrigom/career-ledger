import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createPublicDataset } from '../scripts/lib/content.ts';
import { localizeCareerDataset } from '../scripts/lib/i18n.ts';
import { stagePublicAssets } from '../scripts/lib/frontend-guards.ts';
import { validateProject } from '../scripts/lib/validation.ts';
import { first, REVIEW_WEBP } from './helpers.ts';

test('public galleries preserve approved images and translations without review storage', async context => {
  const data = await createPublicDataset();
  const project = first(data.projects);
  const image = {
    kind: 'image' as const, src: 'assets/projects/gallery.webp', width: 320, height: 180,
    alt: 'Example interface with visible project navigation.', caption: 'The project interface and its navigation.',
    approval: { approvedBy: 'owner' as const, reviewedAt: '2026-08-28' },
    source: { kind: 'owner-provided' as const, providedAt: '2026-08-27' }
  };
  const { caption, source, ...preview } = image;
  project.presentation = { preview, gallery: [image] };
  const translation = project.localizations?.['pt-BR'];
  assert.ok(translation);
  translation.previewAlt = 'Interface de exemplo com navegação do projeto.';
  translation.gallery = [{ alt: 'Interface de exemplo com navegação do projeto.', caption: 'A interface do projeto e sua navegação.' }];
  assert.deepEqual(validateProject(project), []);
  assert.equal(localizeCareerDataset(data, 'pt-BR').projects.find(item => item.id === project.id)?.presentation?.gallery?.[0]?.caption, 'A interface do projeto e sua navegação.');
  for (const changed of [
    { ...image, src: 'assets/review/private.webp' },
    { ...image, approval: undefined },
    { ...image, caption: '' },
    { ...image, source: { kind: 'web', url: 'https://example.com/?secret=x', capturedAt: '2026-08-27' } }
  ]) {
    assert.ok(validateProject({ ...project, presentation: { preview, gallery: [changed] } }).length > 0);
  }
  assert.ok(validateProject({ ...project, presentation: { preview, gallery: [image, image] } }).length > 0);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'career-public-gallery-'));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const publicDir = path.join(root, 'public');
  await fs.mkdir(path.join(publicDir, 'assets', 'projects'), { recursive: true });
  await fs.writeFile(path.join(publicDir, 'assets', 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  await fs.writeFile(path.join(publicDir, image.src), REVIEW_WEBP);
  await fs.writeFile(path.join(publicDir, 'assets', 'projects', 'unapproved.webp'), REVIEW_WEBP);
  await stagePublicAssets([project], publicDir, path.join(root, 'out'));
  assert.deepEqual(await fs.readFile(path.join(root, 'out', image.src)), REVIEW_WEBP);
  await assert.rejects(fs.access(path.join(root, 'out', 'assets', 'projects', 'unapproved.webp')));
  const diagram = { kind: 'diagram', variant: 'system' };
  await assert.rejects(stagePublicAssets([{ presentation: { preview: diagram, gallery: [{ ...image, width: 321 }] } }], publicDir, path.join(root, 'bad')), /declared dimensions/);
  await assert.rejects(stagePublicAssets([{ presentation: { preview, gallery: [{ ...image, approval: undefined }] } }], publicDir, path.join(root, 'bad')), /owner-approved/);
});
