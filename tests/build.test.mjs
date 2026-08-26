import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildSite, verifyGeneratedLinks } from '../scripts/lib/build.mjs';

test('static build works under a GitHub project-page base path', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'career-ledger-build-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));

  const result = await buildSite({
    distDir: directory,
    siteUrl: 'https://engineer.example',
    basePath: '/career-ledger'
  });

  const index = await fs.readFile(path.join(directory, 'index.html'), 'utf8');
  const dataset = JSON.parse(await fs.readFile(path.join(directory, 'data', 'career.json'), 'utf8'));

  assert.match(index, /href="\/career-ledger\/assets\/styles\.css"/);
  assert.match(index, /href="\/career-ledger\/timeline\/"/);
  assert.ok(result.files.includes('entries/career-ledger-foundation/index.html'));
  assert.equal(dataset.profile.name, 'Andrews');
  assert.deepEqual(await verifyGeneratedLinks(directory, { basePath: '/career-ledger' }), []);
});
