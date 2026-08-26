import assert from 'node:assert/strict';
import test from 'node:test';
import { createPublicDataset } from '../scripts/lib/content.mjs';

test('public dataset is aggregated from approved content only', async () => {
  const data = await createPublicDataset();

  assert.equal(data.schemaVersion, 1);
  assert.ok(data.stats.entries >= 1);
  assert.ok(data.stats.projects >= 1);
  assert.equal(data.stats.entries, data.entries.length);
  assert.equal(data.stats.projects, data.projects.length);
  assert.ok(data.taxonomy.areas.some((area) => area.label === 'Developer Experience' && area.count > 0));
  assert.ok(data.technologies.some((technology) => technology.label === 'Node.js'));
  assert.equal('$schema' in data.profile, false);
  assert.equal('$schema' in data.entries[0], false);
});

test('public dataset generation is deterministic', async () => {
  const first = await createPublicDataset();
  const second = await createPublicDataset();
  assert.deepEqual(second, first);
});
