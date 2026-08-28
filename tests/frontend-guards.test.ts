import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { stagePublicAssets, verifyFrontendBudget, verifyLocalResources } from '../scripts/lib/frontend-guards.ts';

async function workspace(context: TestContext) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'career-frontend-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test('asset staging does not read or copy unreferenced project images', async (context) => {
  const directory = await workspace(context);
  const source = path.join(directory, 'public');
  const destination = path.join(directory, 'staged');
  await fs.mkdir(path.join(source, 'assets', 'projects'), { recursive: true });
  await fs.writeFile(path.join(source, 'assets', 'favicon.svg'), '<svg/>');
  await fs.writeFile(path.join(source, 'assets', 'projects', 'unreviewed.webp'), 'not approved');
  await stagePublicAssets([], source, destination);
  assert.equal(await fs.readFile(path.join(destination, 'assets', 'favicon.svg'), 'utf8'), '<svg/>');
  await assert.rejects(fs.access(path.join(destination, 'assets', 'projects', 'unreviewed.webp')));
});

test('images require owner approval, safe encoding, and a bounded file size', async (context) => {
  const directory = await workspace(context);
  await fs.mkdir(path.join(directory, 'assets', 'projects'), { recursive: true });
  await fs.writeFile(path.join(directory, 'assets', 'favicon.svg'), '<svg/>');
  const preview: { kind: 'image'; src: string; width: number; height: number; approval?: { approvedBy: string; reviewedAt: string } } = { kind: 'image', src: 'assets/projects/reviewed.webp', width: 320, height: 180 };
  const project = { presentation: { preview } };
  const destination = path.join(directory, 'staged');
  await assert.rejects(stagePublicAssets([project], directory, destination), /owner-approved/);
  preview.approval = { approvedBy: 'owner', reviewedAt: '2026-08-26' };
  await fs.writeFile(path.join(directory, preview.src), '<svg/>');
  await assert.rejects(stagePublicAssets([project], directory, destination), /encoding/);
  await fs.writeFile(path.join(directory, preview.src), Buffer.alloc(256_001));
  await assert.rejects(stagePublicAssets([project], directory, destination), /250 KB/);
  preview.src = '../outside.webp';
  await assert.rejects(stagePublicAssets([project], directory, destination), /owner-approved/);
});

test('JavaScript budgets distinguish primary scripts from the lazy architecture chunk', async (context) => {
  const directory = await workspace(context);
  await fs.writeFile(path.join(directory, 'site.hash.js'), 'const site = true;');
  await fs.writeFile(path.join(directory, 'architecture-scene.hash.js'), 'const scene = true;');
  const budget = await verifyFrontendBudget(directory);
  assert.ok(budget.main > 0);
  assert.ok(budget.architecture > 0);
  await assert.rejects(verifyFrontendBudget(directory, { main: 1, architecture: 180_000 }), /budget exceeded/);
});

test('external navigation is allowed but external runtime assets are rejected', async (context) => {
  const directory = await workspace(context);
  const file = path.join(directory, 'index.html');
  await fs.writeFile(file, '<a href="https://example.com">Source</a><link rel="canonical" href="https://example.com/">');
  await verifyLocalResources(directory);
  await fs.writeFile(file, '<script src="https://example.com/runtime.js"></script>');
  await assert.rejects(verifyLocalResources(directory), /External runtime resource/);
});
