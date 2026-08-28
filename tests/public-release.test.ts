import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildCandidatePreview } from '../scripts/lib/preview.ts';

test('local preview remains isolated after every pending draft has been approved', async context => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'career-empty-preview-'));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const candidatesDir = path.join(root, 'candidates');
  const activitiesDir = path.join(root, 'activities');
  await fs.mkdir(candidatesDir);
  await fs.mkdir(activitiesDir);
  const distDir = path.join(root, 'preview');
  const result = await buildCandidatePreview({ candidatesDir, activitiesDir, distDir });
  assert.equal(result.candidateCount, 0);
  const data = JSON.parse(await fs.readFile(path.join(distDir, 'data/career.json'), 'utf8'));
  assert.equal(data.preview, true);
  assert.equal(data.projects.length, 16);
  assert.equal(data.reviewMedia, undefined);
  const html = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
  assert.match(html, /noindex/);
  assert.doesNotMatch(html, /static\.cloudflareinsights\.com/);
});

test('Cloudflare release stays manual and uploads only the verified static artifact', async () => {
  const config = JSON.parse(await fs.readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.name, 'andrewsrigom');
  assert.equal(config.pages_build_output_dir, './dist');
  const workflow = await fs.readFile(new URL('../.github/workflows/cloudflare-pages.yml', import.meta.url), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /inputs\.confirm_publication == true/);
  assert.doesNotMatch(workflow, /^  (?:push|pull_request|schedule|workflow_run):/m);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /pages deploy dist --project-name andrewsrigom/);
  assert.doesNotMatch(workflow, /\.career\/|refresh_token|oauth_token/);
});
