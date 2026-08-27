import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { PATHS } from '../scripts/lib/constants.ts';
import { readJson, writeJson } from '../scripts/lib/files.ts';
import { calculateActivityDomainMix } from '../scripts/lib/domains.ts';
import {
  ValidationError, parseCandidate, parseEntry, parseProject, parseProfile,
  parseTaxonomy, parseLocalConfig, parsePrivateActivity, parsePrivateWorkstream,
  validatePublicContent, validatePrivateWorkspace
} from '../scripts/lib/validation.ts';

test('typed record parsers reject unknown input instead of asserting a shape', () => {
  const parsers = [parseCandidate, parseEntry, parseProject, parseProfile, parseTaxonomy,
    parseLocalConfig, parsePrivateActivity, parsePrivateWorkstream];
  for (const parse of parsers) {
    for (const value of [null, undefined, 12, 'record', [], {}]) {
      assert.throws(() => parse(value), ValidationError);
    }
  }
});

test('candidate parsing cannot silently accept already-approved publication metadata', async () => {
  const raw = await readJson(path.join(PATHS.publicProjects, 'career-ledger.json'));
  const project = parseProject(raw);
  assert.throws(() => parseCandidate(project), ValidationError);
  const candidate = parseCandidate({
    ...project,
    publication: { status: 'candidate', sanitized: true, reviewedAt: null, approvedBy: null }
  });
  assert.equal(candidate.recordType, 'project');
  assert.equal(candidate.publication.approvedBy, null);
});

test('malformed public JSON reports validation errors before relationship traversal', async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'career-types-public-'));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const profileFile = path.join(root, 'profile.json');
  const taxonomyFile = path.join(root, 'taxonomy.json');
  await writeJson(profileFile, null);
  await writeJson(taxonomyFile, { areas: 'invalid', kinds: 5 });
  await assert.rejects(
    validatePublicContent({
      profileFile, taxonomyFile, resumeFile: path.join(root, 'resume.json'),
      entriesDir: path.join(root, 'entries'), projectsDir: path.join(root, 'projects')
    }),
    (error: unknown) => error instanceof ValidationError && error.issues.some((issue) => issue.includes('must be an array'))
  );
});

test('malformed private records remain findings and never enter typed relationship maps', async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'career-types-private-'));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const activitiesDir = path.join(root, 'activities');
  await writeJson(path.join(activitiesDir, 'invalid.json'), null);
  const issues = await validatePrivateWorkspace({
    activitiesDir, workstreamsDir: path.join(root, 'workstreams'),
    draftsDir: path.join(root, 'drafts'), initiativesDir: path.join(root, 'initiatives')
  });
  assert.ok(issues.some((issue) => issue.includes('must be an object')));
});

test('unknown domain values cannot become recorded-activity percentages', () => {
  const result = calculateActivityDomainMix([
    null, { domains: ['not-a-domain', 4] }, { domains: ['frontend', 'frontend', 'backend'] }
  ]);
  assert.equal(result.activityCount, 1);
  assert.deepEqual(result.items.map(({ domain, percentage }) => ({ domain, percentage })), [
    { domain: 'backend', percentage: 50 }, { domain: 'frontend', percentage: 50 }
  ]);
});

test('the documented native TypeScript CLI runs without a compiler output directory', () => {
  const result = spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/career.ts', 'help'], {
    cwd: PATHS.root, encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Career Ledger/);
  assert.match(result.stdout, /--experimental-strip-types scripts\/career\.ts/);
});
