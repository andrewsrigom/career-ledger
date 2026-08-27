import { parseProject, parseEntry, parsePrivateActivity, parsePrivateWorkstream, parsePrivateInitiative } from '../scripts/lib/validation.ts';
import { first } from './helpers.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { PATHS } from '../scripts/lib/constants.ts';
import { readJson, writeJson } from '../scripts/lib/files.ts';
import {
  validateEntry,
  validatePrivateActivity,
  validatePrivateInitiative,
  validatePrivateWorkspace,
  validatePrivateWorkstream,
  validateProject,
  validatePublicContent
} from '../scripts/lib/validation.ts';

test('included public content is valid', async () => {
  const result = await validatePublicContent();
  assert.deepEqual(result.issues, []);
});

test('project presentation and recorded activity mix are explicit and bounded', async () => {
  const project = parseProject(await readJson(`${PATHS.publicProjects}/career-ledger.json`));
  project.presentation = { preview: { kind: 'image', src: 'assets/projects/career-ledger.webp', alt: 'Career Ledger project overview', width: 1280, height: 800, approval: { approvedBy: 'owner', reviewedAt: '2026-08-26' } } };
  assert.ok(project.localizations?.['pt-BR']);
  project.localizations['pt-BR'].previewAlt = 'Visão geral do projeto Career Ledger';
  project.activityMix = { basis: 'recorded-activities', activityCount: 10, items: [{ domain: 'frontend', percentage: 60 }, { domain: 'backend', percentage: 40 }] };
  assert.deepEqual(validateProject(project), []);

  assert.ok(validateProject({ ...project, activityMix: { ...project.activityMix, basis: 'hours' } }).some((item) => item.includes('recorded-activities')));
  assert.equal(project.presentation.preview.kind, 'image');
  project.presentation.preview.src = 'https://example.com/image.webp';
  assert.ok(validateProject(project).some((item) => item.includes('preview.src')));
});

test('candidate and public publication modes are distinct', async () => {
  const approved = parseEntry(await readJson(`${PATHS.publicEntries}/career-ledger-foundation.json`));
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

test('public entry significance stays conservative and evidence-gated', async () => {
  const candidate = parseEntry(await readJson(`${PATHS.root}/templates/public-entry-candidate.json`), { mode: 'candidate' });
  assert.deepEqual(validateEntry(candidate, { mode: 'candidate' }), []);

  candidate.significance = 'achievement';
  assert.ok(validateEntry(candidate, { mode: 'candidate' }).some((item) => item.includes('require at least one supported outcome')));

  candidate.significance = 'milestone';
  candidate.status = 'active';
  assert.ok(validateEntry(candidate, { mode: 'candidate' }).some((item) => item.includes('milestone entries must be completed')));
});

test('localized entry copy must remain structurally aligned with its source record', async () => {
  const entry = parseEntry(await readJson(`${PATHS.publicEntries}/career-ledger-foundation.json`));
  const incomplete = structuredClone(entry);
  assert.ok(incomplete.localizations?.['pt-BR']);
  incomplete.localizations['pt-BR'].contributions.pop();

  const issues = validateEntry(incomplete, { mode: 'public' });
  assert.ok(issues.some((item) => item.includes('must contain exactly 3 item(s) to match the source record')));
});

test('confirmed private outcomes require a known evidence level', async () => {
  const initiative = parsePrivateInitiative(await readJson(`${PATHS.root}/templates/private-initiative.json`));
  first(initiative.potentialOutcomes).status = 'confirmed';
  first(initiative.potentialOutcomes).evidenceLevel = 'unknown';

  const issues = validatePrivateInitiative(initiative);
  assert.ok(issues.some((item) => item.includes('confirmed outcomes require a known evidence level')));
});

test('canonical private activity and workstream templates are valid', async () => {
  const activity = parsePrivateActivity(await readJson(`${PATHS.root}/templates/private-activity.json`));
  const workstream = parsePrivateWorkstream(await readJson(`${PATHS.root}/templates/private-workstream.json`));

  assert.deepEqual(validatePrivateActivity(activity), []);
  assert.deepEqual(validatePrivateWorkstream(workstream), []);
});

test('activity domains are normalized and represent full-stack work compositionally', async () => {
  const activity = parsePrivateActivity(await readJson(`${PATHS.root}/templates/private-activity.json`));
  activity.domains = ['frontend', 'backend'];
  assert.deepEqual(validatePrivateActivity(activity), []);

  assert.ok(validatePrivateActivity({ ...activity, domains: ['full-stack'] }).some((item) => item.includes('must be one of')));

  activity.domains = [];
  assert.ok(validatePrivateActivity(activity).some((item) => item.includes('must contain at least 1 item')));
});

test('achievement activities require confirmed outcomes and supported provenance', async () => {
  const activity = parsePrivateActivity(await readJson(`${PATHS.root}/templates/private-activity.json`));
  activity.significance = 'achievement';
  first(activity.evidence).provenance = 'inferred';

  const issues = validatePrivateActivity(activity);
  assert.ok(issues.some((item) => item.includes('require at least one confirmed outcome')));
  assert.ok(issues.some((item) => item.includes('require observed, provided, or derived evidence')));
});

test('private workspace validates bidirectional activity and workstream provenance', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'career-ledger-private-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const activitiesDir = path.join(directory, 'activities');
  const workstreamsDir = path.join(directory, 'workstreams');
  const activity = parsePrivateActivity(await readJson(`${PATHS.root}/templates/private-activity.json`));
  const workstream = parsePrivateWorkstream(await readJson(`${PATHS.root}/templates/private-workstream.json`));
  activity.workstreamId = workstream.id;

  await writeJson(path.join(activitiesDir, activity.projectId, `${activity.id}.json`), activity);
  await writeJson(path.join(workstreamsDir, workstream.projectId, `${workstream.id}.json`), workstream);

  const options = {
    activitiesDir,
    workstreamsDir,
    draftsDir: path.join(directory, 'drafts'),
    initiativesDir: path.join(directory, 'initiatives')
  };
  assert.deepEqual(await validatePrivateWorkspace(options), []);

  workstream.achievements.push({
    id: 'unsupported-achievement',
    date: activity.occurredAt,
    statement: 'Claimed an outcome that has not yet been confirmed in the underlying activity.',
    evidenceLevel: 'observed',
    activityIds: [activity.id],
    evidenceRefs: [first(activity.evidence).id],
    provenance: 'observed'
  });
  await writeJson(path.join(workstreamsDir, workstream.projectId, `${workstream.id}.json`), workstream);

  const issues = await validatePrivateWorkspace(options);
  assert.ok(issues.some((item) => item.includes('achievements require a confirmed outcome')));
});
