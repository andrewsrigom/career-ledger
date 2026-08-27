import type { ResumeRecord, Publication, Experience } from '../scripts/lib/model.ts';
import { first } from './helpers.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createCareerDataset, createPublicDataset } from '../scripts/lib/content.ts';
import { localizeCareerDataset } from '../scripts/lib/i18n.ts';
import { validatePublicContent } from '../scripts/lib/validation.ts';

test('public dataset is aggregated from approved content only', async () => {
  const data = await createPublicDataset();

  assert.equal(data.schemaVersion, 1);
  assert.ok(data.stats.entries >= 1);
  assert.ok(data.stats.projects >= 1);
  assert.equal(data.stats.entries, data.entries.length);
  assert.equal(data.stats.projects, data.projects.length);
  assert.equal(data.resume, null);
  assert.equal(data.stats.experienceYears, null);
  assert.ok(data.taxonomy.areas.some((area) => area.label === 'Developer Experience' && area.count > 0));
  assert.ok(data.technologies.some((technology) => technology.label === 'Node.js'));
  assert.equal(first(data.entries).significance, 'activity');
  assert.deepEqual(first(data.entries).activityTypes, []);
  assert.equal('$schema' in data.profile, false);
  assert.equal('$schema' in first(data.entries), false);
});

test('public dataset generation is deterministic', async () => {
  const first = await createPublicDataset();
  const second = await createPublicDataset();
  assert.deepEqual(second, first);
});

test('PT-BR localization preserves record identity while translating public copy', async () => {
  const source = await createPublicDataset();
  const localized = localizeCareerDataset(source, 'pt-BR');

  assert.equal(localized.locale, 'pt-BR');
  assert.equal(localized.profile.headline, 'Engenheiro de Software Full-Stack Sênior');
  assert.equal(first(localized.entries).id, first(source.entries).id);
  assert.equal(first(localized.entries).title, 'Fundação do Career Ledger');
  assert.ok(first(localized.entries).areas.includes('Experiência de Desenvolvimento'));
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
        period: { start: '2023-10-01', end: '2025-07-31', label: 'October 2023-July 2025' }
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
});
