import assert from 'node:assert/strict';
import test from 'node:test';
import { PATHS } from '../scripts/lib/constants.mjs';
import { readJson } from '../scripts/lib/files.mjs';
import {
  validateEntry,
  validatePrivateInitiative,
  validatePublicContent
} from '../scripts/lib/validation.mjs';

test('included public content is valid', async () => {
  const result = await validatePublicContent();
  assert.deepEqual(result.issues, []);
});

test('candidate and public publication modes are distinct', async () => {
  const approved = await readJson(`${PATHS.publicEntries}/career-ledger-foundation.json`);
  const candidate = structuredClone(approved);
  candidate.publication = {
    status: 'candidate',
    sanitized: true,
    reviewedAt: null,
    approvedBy: null
  };

  assert.deepEqual(validateEntry(candidate, { mode: 'candidate' }), []);
  assert.ok(validateEntry(candidate, { mode: 'public' }).length > 0);
  assert.ok(validateEntry(approved, { mode: 'candidate' }).length > 0);
});

test('confirmed private outcomes require a known evidence level', async () => {
  const initiative = await readJson(`${PATHS.root}/templates/private-initiative.json`);
  initiative.potentialOutcomes[0].status = 'confirmed';
  initiative.potentialOutcomes[0].evidenceLevel = 'unknown';

  const issues = validatePrivateInitiative(initiative);
  assert.ok(issues.some((item) => item.includes('confirmed outcomes require a known evidence level')));
});
