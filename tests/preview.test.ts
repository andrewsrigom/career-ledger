import type { CareerDataset } from '../scripts/lib/model.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildCandidatePreview } from '../scripts/lib/preview.ts';
import { PATHS } from '../scripts/lib/constants.ts';

test('candidate preview is isolated, visibly marked, and not indexable', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'career-ledger-preview-'));
  const candidatesDir = path.join(directory, 'candidates');
  const activitiesDir = path.join(directory, 'activities');
  const distDir = path.join(directory, 'site');
  await fs.mkdir(candidatesDir, { recursive: true });
  await fs.mkdir(activitiesDir, { recursive: true });
  context.after(() => fs.rm(directory, { recursive: true, force: true }));

  const approvedEntry = JSON.parse(await fs.readFile(path.join(PATHS.publicEntries, 'career-ledger-foundation.json'), 'utf8'));
  const approvedProject = JSON.parse(await fs.readFile(path.join(PATHS.publicProjects, 'career-ledger.json'), 'utf8'));
  const publication = { status: 'candidate', sanitized: true, reviewedAt: null, approvedBy: null };

  const entry = {
    ...approvedEntry,
    id: 'preview-entry',
    slug: 'preview-entry',
    title: 'Preview Candidate Entry',
    localizations: {
      'pt-BR': {
        ...approvedEntry.localizations['pt-BR'],
        title: 'Registro Candidato de Prévia'
      }
    },
    publication
  };
  const project = {
    ...approvedProject,
    id: 'preview-project',
    slug: 'preview-project',
    name: 'Preview Candidate Project',
    relatedEntries: ['preview-entry'],
    localizations: {
      'pt-BR': {
        ...approvedProject.localizations['pt-BR'],
        name: 'Projeto Candidato de Prévia'
      }
    },
    publication
  };
  const resume = {
    schemaVersion: 1,
    recordType: 'resume',
    id: 'resume',
    slug: 'resume',
    experienceStart: '2016-02-01',
    summary: 'Senior engineer building accessible software products, technical platforms, and reliable delivery systems across the full product lifecycle.',
    highlights: [
      { text: 'Delivered a reusable platform foundation for multiple product teams.', evidenceLevel: 'self-reported' }
    ],
    skills: ['TypeScript', 'System Design', 'Testing Strategy'],
    experiences: [
      {
        id: 'preview-experience',
        organization: 'Preview Organization',
        role: 'Senior Software Engineer',
        engagement: 'full-time',
        location: 'Remote',
        domain: 'Product engineering',
        period: { start: '2016-02-01', end: null, label: 'February 2016-present' },
        summary: 'Led technical implementation for a representative product platform while collaborating across engineering and product disciplines.',
        contributions: ['Defined architecture, implementation boundaries, and automated validation for the representative platform.'],
        outcomes: [{ text: 'Delivered a reusable platform foundation for multiple product teams.', evidenceLevel: 'self-reported' }],
        technologies: ['TypeScript', 'Node.js'],
        relatedProjects: ['preview-project']
      }
    ],
    education: [
      {
        id: 'preview-education',
        credential: 'Software Engineering Program',
        institution: 'Example Institute',
        period: { start: '2020-01-01', end: '2021-12-31', label: '2020-2021' }
      }
    ],
    localizations: {
      'pt-BR': {
        summary: 'Engenheiro sênior que desenvolve produtos de software acessíveis, plataformas técnicas e sistemas confiáveis de entrega em todo o ciclo de produto.',
        highlights: ['Entregou uma fundação de plataforma reutilizável para várias equipes de produto.'],
        skills: ['TypeScript', 'Arquitetura de Sistemas', 'Estratégia de Testes'],
        experiences: [
          {
            id: 'preview-experience',
            role: 'Engenheiro de Software Sênior',
            location: 'Remoto',
            domain: 'Engenharia de produto',
            periodLabel: 'Fevereiro de 2016–presente',
            summary: 'Liderou a implementação técnica de uma plataforma representativa em colaboração com as disciplinas de engenharia e produto.',
            contributions: ['Definiu a arquitetura, os limites de implementação e a validação automatizada da plataforma representativa.'],
            outcomes: ['Entregou uma fundação de plataforma reutilizável para várias equipes de produto.']
          }
        ],
        education: [
          {
            id: 'preview-education',
            credential: 'Programa de Engenharia de Software',
            institution: 'Instituto de Exemplo',
            periodLabel: '2020–2021'
          }
        ]
      }
    },
    publication
  };

  await fs.writeFile(path.join(candidatesDir, 'preview-entry.json'), `${JSON.stringify(entry, null, 2)}\n`);
  await fs.writeFile(path.join(candidatesDir, 'preview-project.json'), `${JSON.stringify(project, null, 2)}\n`);
  await fs.writeFile(path.join(candidatesDir, 'resume.json'), `${JSON.stringify(resume, null, 2)}\n`);
  await fs.writeFile(path.join(activitiesDir, 'sample.json'), JSON.stringify({ domains: ['frontend', 'backend'] }));

  const result = await buildCandidatePreview({
    candidatesDir,
    activitiesDir,
    distDir,
    siteUrl: 'http://127.0.0.1:4173',
    basePath: '/review'
  });
  const index = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
  const portugueseIndex = await fs.readFile(path.join(distDir, 'pt-br', 'index.html'), 'utf8');
  const entryPage = await fs.readFile(path.join(distDir, 'entries', 'preview-entry', 'index.html'), 'utf8');
  const robots = await fs.readFile(path.join(distDir, 'robots.txt'), 'utf8');
  const dataset: CareerDataset = JSON.parse(await fs.readFile(path.join(distDir, 'data', 'career.json'), 'utf8'));

  assert.equal(result.candidateCount, 3);
  assert.match(index, /Draft portfolio preview/);
  assert.match(index, /noindex,nofollow/);
  assert.match(index, /Preview Candidate Project/);
  assert.match(index, /Preview Candidate Entry/);
  assert.match(index, /Preview Organization/);
  assert.match(index, /10\+ years · 1 role/);
  assert.match(index, /href="\/review\/#experience"/);
  assert.match(index, /class="project-index"/);
  assert.match(index, /class="project-row"/);
  assert.match(index, />Results</);
  assert.doesNotMatch(index, /<details class="project-story"/);
  assert.match(index, /href="#work"/);
  assert.match(index, /href="\/review\/pt-br\/"/);
  assert.match(entryPage, /not public/);
  assert.match(portugueseIndex, /<html lang="pt-BR"[^>]*>/);
  assert.match(portugueseIndex, /Prévia do portfólio/);
  assert.match(portugueseIndex, /Projeto Candidato de Prévia/);
  assert.match(portugueseIndex, /Registro Candidato de Prévia/);
  assert.match(portugueseIndex, /10\+ anos · 1 experiência/);
  assert.match(portugueseIndex, /href="\/review\/_astro\/[^\"]+\.css"/);
  assert.match(portugueseIndex, /href="\/review\/pt-br\/#experience"/);
  assert.equal(robots, 'User-agent: *\nDisallow: /\n');
  assert.equal(dataset.preview, true);
  assert.ok(dataset.resume);
  assert.ok(dataset.activityMix);
  assert.equal(dataset.resume.experienceYears, 10);
  assert.equal(dataset.activityMix.activityCount, 1);
  assert.equal(dataset.activityMix.basis, 'recorded-activities');
  assert.match(index, /Sample: 1 recorded activities/);
  assert.equal(dataset.entries.find((item) => item.id === 'preview-entry')?.publication.status, 'candidate');
  assert.ok(result.files.includes('projects/preview-project/index.html'));
  assert.ok(result.files.includes('pt-br/projects/preview-project/index.html'));
});
