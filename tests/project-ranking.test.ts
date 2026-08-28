import assert from 'node:assert/strict';
import test from 'node:test';
import type { Project, ReviewImage, Resume } from '../scripts/lib/model.ts';
import { createPublicDataset } from '../scripts/lib/content.ts';
import { localizeCareerDataset } from '../scripts/lib/i18n.ts';
import { rankProjects, withRankedProjects } from '../scripts/lib/project-ranking.ts';
import { first } from './helpers.ts';

async function fixture() {
  const data = await createPublicDataset();
  const project = (id: string, overrides: Partial<Project> = {}): Project => ({
    ...first(data.projects), id, slug: id, name: id, relatedEntries: [], areas: [],
    presentation: undefined, featured: false, localizations: undefined, ...overrides
  });
  const areas = (...slugs: string[]) => data.taxonomy.areas.filter((area) => slugs.includes(area.slug)).map((area) => area.label);
  return { data, project, areas };
}

const image: ReviewImage = {
  src: 'assets/review/example.webp', width: 1200, height: 800, alt: 'A real project interface', caption: 'Project interface',
  source: { kind: 'owner-provided', providedAt: '2026-08-26' }
};

test('ranking retains every project, ignores the old selection flag and never mutates input', async () => {
  const { data, project } = await fixture();
  data.projects = Array.from({ length: 12 }, (_, i) => project(`project-${String(i).padStart(2, '0')}`, { featured: i > 5 }));
  const before = structuredClone(data);
  const ranked = rankProjects(data);
  assert.equal(ranked.length, 12);
  assert.equal(ranked.filter((item) => item.prominence === 'flagship').length, 1);
  assert.equal(ranked.filter((item) => item.prominence === 'compact').length, 11);
  assert.deepEqual(ranked.map((item) => item.project.id), data.projects.map((item) => item.id));
  assert.deepEqual(data, before);
  assert.deepEqual(rankProjects({ ...data, projects: [...data.projects].reverse() }), ranked);
  assert.deepEqual(rankProjects({ ...data, projects: [] }), []);
});

test('full-stack, backend, AI and explicit ownership outrank company context', async () => {
  const { data, project, areas } = await fixture();
  data.projects = [
    project('company', { workContext: 'professional', featured: true, areas: areas('frontend-architecture') }),
    project('independent', { workContext: 'independent', ownership: 'end-to-end', areas: areas('frontend-architecture', 'backend-architecture', 'system-design', 'ai-engineering') })
  ];
  const ranked = rankProjects(data);
  assert.equal(first(ranked).project.id, 'independent');
  assert.equal(first(ranked).signals.fullStack, 24);
  assert.equal(first(ranked).signals.backendSystems, 28);
  assert.equal(first(ranked).signals.ai, 24);
  assert.equal(first(ranked).signals.ownership, 24);
});

test('only one substantive current professional project receives an anchor bonus', async () => {
  const { data, project, areas } = await fixture();
  const scope = areas('frontend-architecture', 'backend-architecture', 'system-design', 'ai-engineering');
  data.projects = ['anchor', 'another', 'weak', 'old'].map((id) => project(id, {
    workContext: 'professional', ownership: id === 'weak' ? undefined : 'shared', areas: id === 'weak' ? [] : scope,
    status: id === 'old' ? 'completed' : 'active'
  }));
  const resume: Resume = {
    schemaVersion: 1, recordType: 'resume', id: 'resume', slug: 'resume', experienceStart: '2020-01-01', experienceYears: 6,
    summary: 'Representative professional experience.', highlights: [], skills: [], education: [], publication: first(data.projects).publication,
    experiences: [{ id: 'current-role', organization: 'Example', role: 'Engineer', engagement: 'full-time', location: 'Remote', domain: 'Engineering',
      period: { start: '2025-01-01', end: null, label: 'Current' }, summary: 'Current engineering role.', contributions: [], outcomes: [], technologies: [], relatedProjects: ['anchor', 'another', 'weak', 'old'] }]
  };
  const ranked = rankProjects({ ...data, resume });
  assert.equal(first(ranked).project.id, 'anchor');
  assert.equal(ranked.filter((item) => item.signals.anchor === 50).length, 1);
  assert.equal(ranked.find((item) => item.project.id === 'weak')?.signals.anchor, 0);
  assert.equal(ranked.find((item) => item.project.id === 'old')?.signals.anchor, 0);
});

test('review imagery breaks technical ties only inside the isolated preview and has a bounded bonus', async () => {
  const { data, project } = await fixture();
  data.projects = [project('a-text'), project('z-visual')];
  data.reviewMedia = { 'z-visual': Array.from({ length: 20 }, () => image) };
  assert.equal(first(rankProjects(data)).project.id, 'a-text');
  const preview = rankProjects({ ...data, preview: true });
  assert.equal(first(preview).project.id, 'z-visual');
  assert.equal(first(preview).signals.visuals, 22);
  const approvedImage = project('z-visual', { presentation: { preview: { kind: 'image', src: 'assets/projects/example.webp', alt: image.alt, width: image.width, height: image.height, approval: { approvedBy: 'owner', reviewedAt: '2026-08-26' } } } });
  assert.equal(first(rankProjects({ ...data, projects: [project('a-text'), approvedImage] })).project.id, 'z-visual');
});

test('ownership and full-stack scope are not inferred from stack size, activity percentages or context', async () => {
  const { data, project } = await fixture();
  data.projects = [project('unknown', { workContext: 'independent', technologies: ['React', 'Node.js', 'PostgreSQL', 'AI'],
    activityMix: { basis: 'owner-estimate', items: [{ domain: 'backend', percentage: 100 }] } })];
  const result = first(rankProjects(data));
  assert.equal(result.signals.ownership, 0);
  assert.equal(result.signals.fullStack, 0);
  assert.equal(result.signals.backendSystems, 0);
  assert.equal(result.signals.ai, 0);
  assert.equal(first(rankProjects({ ...data, projects: [project('unknown')] })).score, result.score);
});

test('recency uses recorded work dates, never a new publication stamp or build time', async () => {
  const { data, project } = await fixture();
  const entry = first(data.entries);
  data.updatedAt = '2026-08-26';
  data.entries = [
    { ...entry, id: 'old-entry', period: { start: '2018-01-01', end: '2019-01-01', label: 'Older work' } },
    { ...entry, id: 'new-entry', period: { start: '2026-08-01', end: null, label: 'Current work' } }
  ];
  data.projects = [project('old', { relatedEntries: ['old-entry'] }), project('new', { relatedEntries: ['new-entry'] })];
  const results = rankProjects(data);
  assert.equal(first(results).project.id, 'new');
  assert.equal(first(results).signals.recency, 12);
  assert.equal(results[1]?.signals.recency, -18);
});

test('overlapping evidence is downweighted without hiding work or penalizing shared technology', async () => {
  const { data, project } = await fixture();
  const entry = first(data.entries);
  data.entries = [entry, { ...entry, id: 'different-work' }];
  data.projects = [project('a', { relatedEntries: [entry.id] }), project('b', { relatedEntries: [entry.id] }), project('c', { relatedEntries: ['different-work'] })];
  const results = rankProjects(data);
  assert.deepEqual(results.map((item) => item.project.id), ['a', 'c', 'b']);
  assert.equal(results[2]?.signals.overlap, -24);
  assert.equal(results[1]?.signals.overlap, 0);
});

test('canonical ordering is locale-stable and never serializes scores or prominence', async () => {
  const { data, project } = await fixture();
  data.projects = [project('z', { relatedEntries: [first(data.entries).id] }), project('a')];
  const ranked = withRankedProjects(data);
  const portuguese = rankProjects(localizeCareerDataset(ranked, 'pt-BR'));
  assert.deepEqual(portuguese.map((item) => item.project.id), ranked.projects.map((item) => item.id));
  assert.doesNotMatch(JSON.stringify(ranked), /"(?:score|signals|prominence)":/);
  assert.deepEqual(withRankedProjects(ranked), ranked);
});
