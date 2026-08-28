import type { ResumeRecord, Publication, Experience, ProjectRecord } from '../scripts/lib/model.ts';
import { first } from './helpers.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createCareerDataset, createPublicDataset } from '../scripts/lib/content.ts';
import { localizeCareerDataset } from '../scripts/lib/i18n.ts';
import { rankProjects } from '../scripts/lib/project-ranking.ts';
import { validatePublicContent } from '../scripts/lib/validation.ts';

test('public dataset is aggregated from approved content only', async () => {
  const data = await createPublicDataset();

  assert.equal(data.schemaVersion, 1);
  assert.ok(data.stats.entries >= 1);
  assert.ok(data.stats.projects >= 1);
  assert.equal(data.stats.entries, data.entries.length);
  assert.equal(data.stats.projects, data.projects.length);
  assert.equal(data.resume?.publication.status, 'approved');
  assert.equal(data.stats.experienceYears, 10);
  assert.ok(data.taxonomy.areas.some((area) => area.label === 'Developer Experience' && area.count > 0));
  assert.ok(data.technologies.some((technology) => technology.label === 'Node.js'));
  const foundation = data.entries.find(entry => entry.id === 'career-ledger-foundation');
  assert.equal(foundation?.significance, 'activity');
  assert.deepEqual(foundation?.activityTypes, []);
  assert.ok([...data.entries, ...data.projects].every(record => record.publication.status === 'approved'));
  assert.equal('$schema' in data.profile, false);
  assert.equal('$schema' in first(data.entries), false);
});

test('public dataset generation is deterministic', async () => {
  const first = await createPublicDataset();
  const second = await createPublicDataset();
  assert.deepEqual(second, first);
});

test('project order follows evidence instead of professional context and survives localization', async () => {
  const content = await validatePublicContent();
  const baseProject = first(content.projects).value;
  const baseEntry = first(content.entries).value;
  const project = (id: string, overrides: Partial<ProjectRecord> = {}): ProjectRecord => ({
    ...baseProject, id, slug: id, name: id, relatedEntries: [], ...overrides
  });
  const entry = (id: string, end: string) => ({
    ...baseEntry, id, slug: id, period: { start: '2020-01-01', end, label: 'Recorded work' }
  });
  const entries = [entry('older-work', '2022-01-01'), entry('recent-work', '2026-08-01')];
  const projects = [
    project('a-professional', { workContext: 'professional', relatedEntries: ['missing-entry'] }),
    project('b-unclassified'),
    project('old-professional', { status: 'completed', workContext: 'professional', relatedEntries: ['older-work'] }),
    project('z-independent', { workContext: 'independent', ownership: 'end-to-end', relatedEntries: ['recent-work'], featured: false })
  ];
  const original = structuredClone(projects);
  const data = createCareerDataset({ ...content, entries, projects });
  const expected = ['z-independent', 'old-professional', 'a-professional', 'b-unclassified'];
  assert.deepEqual(data.projects.map((item) => item.id), expected);
  assert.deepEqual(projects, original);
  assert.deepEqual(createCareerDataset({ ...content, entries: [...entries].reverse(), projects: [...projects].reverse() }).projects, data.projects);
  assert.deepEqual(localizeCareerDataset(data, 'pt-BR').projects.map((item) => item.id), expected);
  assert.deepEqual(data.projects.find((item) => item.id === 'a-professional')?.relatedEntries, []);

  const tied = [project('zeta', { name: 'A name' }), project('alpha', { name: 'Z name' })];
  assert.deepEqual(createCareerDataset({ ...content, projects: tied }).projects.map((item) => item.id), ['alpha', 'zeta']);
});

test('PT-BR localization preserves record identity while translating public copy', async () => {
  const source = await createPublicDataset();
  const localized = localizeCareerDataset(source, 'pt-BR');

  assert.equal(localized.locale, 'pt-BR');
  assert.equal(localized.profile.headline, 'Engenheiro de Software Full-Stack Sênior');
  assert.equal(first(localized.entries).id, first(source.entries).id);
  const foundation = localized.entries.find(entry => entry.id === 'career-ledger-foundation');
  assert.equal(foundation?.title, 'Fundação do Career Ledger');
  assert.ok(foundation?.areas.includes('Experiência de Desenvolvimento'));
  assert.equal(first(localized.projects).slug, first(source.projects).slug);
  assert.equal(localized.taxonomy.kinds.find((kind) => kind.value === 'project')?.label, 'Projeto');
  assert.doesNotMatch(JSON.stringify(localized), /localizations/);
});

test('resume experience is deterministic and keeps the active role first', async () => {
  const content = await validatePublicContent();
  const publication: Publication = { status: 'candidate', sanitized: true, reviewedAt: null, approvedBy: null };
  const baseExperience: Omit<Experience, 'id' | 'organization' | 'period'> = {
    role: 'Senior Software Engineer',
    engagement: 'full-time',
    location: 'Remote',
    domain: 'Product engineering',
    summary: 'Built and maintained a representative software product across architecture, implementation, and delivery.',
    contributions: ['Defined and implemented the representative product architecture and delivery workflow.'],
    outcomes: [],
    technologies: ['TypeScript'],
    relatedProjects: []
  };
  const resume: ResumeRecord = {
    schemaVersion: 1,
    recordType: 'resume',
    id: 'resume',
    slug: 'resume',
    experienceStart: '2016-02-01',
    summary: 'Senior engineer building accessible software products, technical platforms, and reliable delivery systems across the full product lifecycle.',
    highlights: [],
    skills: ['TypeScript', 'System Design', 'Testing Strategy'],
    experiences: [
      {
        ...baseExperience,
        id: 'completed-role',
        organization: 'Completed Organization',
        period: { start: '2023-10-01', end: '2025-07-31', label: 'October 2023-July 2025' },
        relatedProjects: ['recent-role-project', 'entry-dated-project']
      },
      {
        ...baseExperience,
        id: 'earlier-role',
        organization: 'Earlier Organization',
        period: { start: '2016-02-01', end: '2021-01-31', label: 'February 2016-January 2021' },
        relatedProjects: ['older-role-project']
      },
      {
        ...baseExperience,
        id: 'active-role',
        organization: 'Active Organization',
        period: { start: '2025-06-01', end: null, label: 'June 2025-present' }
      }
    ],
    education: [],
    publication
  };

  const data = createCareerDataset({ ...content, resume }, { preview: true });
  assert.ok(data.resume);
  assert.equal(data.resume.experienceYears, 10);
  assert.equal(first(data.resume.experiences).id, 'active-role');

  const project = first(content.projects).value;
  const entry = first(content.entries).value;
  const projectData = createCareerDataset({
    ...content,
    resume,
    entries: [{ ...entry, period: { start: '2019-01-01', end: '2020-01-01', label: 'Recorded project work' } }],
    projects: [
      { ...project, id: 'older-role-project', slug: 'older-role-project', name: 'A older role', status: 'completed', relatedEntries: [] },
      { ...project, id: 'entry-dated-project', slug: 'entry-dated-project', status: 'completed', relatedEntries: [entry.id] },
      { ...project, id: 'recent-role-project', slug: 'recent-role-project', name: 'Z recent role', status: 'completed', relatedEntries: [] }
    ]
  });
  // Recorded contributions can outweigh chronology. Dates remain a bounded signal.
  assert.deepEqual(projectData.projects.map((item) => item.id), ['entry-dated-project', 'recent-role-project', 'older-role-project']);
  const ranked = rankProjects(projectData);
  assert.equal(ranked.find((item) => item.project.id === 'entry-dated-project')?.date, '2020-01-01');
  assert.equal(ranked.find((item) => item.project.id === 'recent-role-project')?.date, '2025-07-31');
  assert.equal(ranked.find((item) => item.project.id === 'older-role-project')?.date, '2021-01-31');
});
