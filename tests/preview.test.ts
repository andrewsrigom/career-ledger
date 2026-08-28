import type { CareerDataset } from '../scripts/lib/model.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildCandidatePreview } from '../scripts/lib/preview.ts';
import { PATHS } from '../scripts/lib/constants.ts';
import { first, REVIEW_WEBP, reviewMediaFixture, PORTRAIT_WEBP, portraitFixture, recommendationFixture } from './helpers.ts';

test('candidate preview is isolated, visibly marked, and not indexable', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'career-ledger-preview-'));
  const candidatesDir = path.join(directory, 'candidates');
  const activitiesDir = path.join(directory, 'activities');
  const distDir = path.join(directory, 'site');
  const mediaDir = path.join(directory, 'media');
  await fs.mkdir(path.join(mediaDir, 'images'), { recursive: true });
  const mediaFixture = reviewMediaFixture('preview-project');
  const mediaProject = first(mediaFixture.projects);
  const mediaImage = first(mediaProject.images);
  const images = [
    mediaImage,
    { ...mediaImage, file: 'local.webp', source: { kind: 'local-capture', capturedAt: '2026-08-27' } },
    { ...mediaImage, file: 'existing.webp', source: { kind: 'project-asset', collectedAt: '2026-08-27' } }
  ];
  for (const image of images) await fs.writeFile(path.join(mediaDir, 'images', image.file), REVIEW_WEBP);
  await fs.writeFile(path.join(mediaDir, 'images', 'colleague.webp'), PORTRAIT_WEBP);
  await fs.writeFile(path.join(mediaDir, 'preview.json'), JSON.stringify({ ...mediaFixture, projects: [{ ...mediaProject, images }], portraits: [portraitFixture()] }));
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
    workContext: 'professional',
    activityMix: { basis: 'recorded-activities', activityCount: 4, items: [
      { domain: 'frontend', percentage: 37.5 }, { domain: 'backend', percentage: 62.5 }
    ] },
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
    contact: { email: 'owner+work@example.com', phone: '+5521987654321', whatsapp: true, links: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/example-owner/' }] },
    recommendations: [recommendationFixture(), { ...recommendationFixture(), id: 'another-colleague', name: 'Another Colleague', quote: 'A <strong>thoughtful</strong> colleague who treats quoted markup as ordinary text.' }],
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
        recommendations: [
          { id: 'example-colleague', relationship: 'Trabalhou comigo na mesma equipe', quote: 'Um colega atencioso que compartilhou conhecimento e ajudou a equipe a resolver problemas difíceis.' },
          { id: 'another-colleague', relationship: 'Trabalhou comigo na mesma equipe', quote: 'Um colega que cuida da segurança ao exibir conteúdo como texto comum.' }
        ],
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
  await fs.writeFile(path.join(candidatesDir, 'owner-estimate-project.json'), JSON.stringify({
    ...project, id: 'owner-estimate-project', slug: 'owner-estimate-project', name: 'Owner Estimate Project',
    status: 'completed', workContext: 'independent', relatedEntries: [],
    activityMix: { basis: 'owner-estimate', items: [
      { domain: 'backend', percentage: 35 }, { domain: 'frontend', percentage: 50 }, { domain: 'devops', percentage: 15 }
    ] },
    localizations: { 'pt-BR': { ...project.localizations['pt-BR'], name: 'Projeto com Estimativa do Autor' } }
  }));
  await fs.writeFile(path.join(candidatesDir, 'resume.json'), `${JSON.stringify(resume, null, 2)}\n`);
  await fs.writeFile(path.join(activitiesDir, 'sample.json'), JSON.stringify({ domains: ['frontend', 'backend'] }));

  const result = await buildCandidatePreview({
    candidatesDir,
    activitiesDir,
    mediaDir,
    distDir,
    siteUrl: 'http://127.0.0.1:4173',
    basePath: '/review'
  });
  const index = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
  const portugueseIndex = await fs.readFile(path.join(distDir, 'pt-br', 'index.html'), 'utf8');
  assert.match(index, /id="recommendations"/);
  assert.match(index, /Example Colleague/);
  assert.match(index, /src="\/review\/assets\/review\/colleague.webp"/);
  assert.match(portugueseIndex, /Traduções do inglês/);
  assert.match(portugueseIndex, /Um colega atencioso/);
  assert.match(index, /id="contact"/);
  assert.match(index, /href="mailto:owner%2Bwork@example.com"/);
  assert.match(index, /href="tel:\+5521987654321"/);
  assert.match(index, /href="https:\/\/wa.me\/5521987654321"/);
  assert.match(index, /href="\/review\/#contact"/);
  assert.match(portugueseIndex, /href="\/review\/pt-br\/#contact"/);
  assert.match(portugueseIndex, /Vamos conversar/);
  assert.match(portugueseIndex, /Fale comigo/);
  assert.match(index, /&lt;strong&gt;thoughtful/);
  assert.doesNotMatch(index, /<strong>thoughtful/);
  const recommendationsSection = index.slice(index.indexOf('id="recommendations"'), index.indexOf('id="about"'));
  assert.doesNotMatch(recommendationsSection, /<time|2023-09|capturedAt|media\.licdn/);
  assert.match(recommendationsSection, /recommendation__initials/);
  assert.deepEqual(await fs.readFile(path.join(distDir, 'assets', 'review', 'colleague.webp')), PORTRAIT_WEBP);
  const entryPage = await fs.readFile(path.join(distDir, 'entries', 'preview-entry', 'index.html'), 'utf8');
  const portugueseEntryPage = await fs.readFile(path.join(distDir, 'pt-br', 'entries', 'preview-entry', 'index.html'), 'utf8');
  const robots = await fs.readFile(path.join(distDir, 'robots.txt'), 'utf8');
  const dataset: CareerDataset = JSON.parse(await fs.readFile(path.join(distDir, 'data', 'career.json'), 'utf8'));

  assert.equal(result.candidateCount, 4);
  assert.match(index, /Local preview/);
  assert.match(index, /noindex,nofollow/);
  assert.match(index, /Preview Candidate Project/);
  assert.match(entryPage, /Preview Candidate Entry/);
  assert.match(index, /Preview Organization/);
  assert.match(index, /10\+ years · 1 role/);
  assert.match(index, /href="\/review\/#experience"/);
  assert.match(index, /class="project-index"/);
  assert.match(index, /class="project-row project-row--flagship"/);
  assert.doesNotMatch(index, /data-score|work-archive/);
  assert.match(index, />Results</);
  assert.doesNotMatch(index, /<details class="project-story"/);
  assert.match(index, /href="#work"/);
  assert.match(index, /href="\/review\/pt-br\/"/);
  assert.match(entryPage, /Not published\. Waiting for your approval\./);
  assert.match(entryPage, /noindex,nofollow/);
  assert.doesNotMatch(entryPage, /class="record-note"|sanitized for review|Raw evidence remains private/);
  assert.match(portugueseIndex, /<html lang="pt-BR"[^>]*>/);
  assert.match(portugueseIndex, /Prévia local/);
  assert.match(portugueseEntryPage, /Ainda não publicado\. Aguardando sua aprovação\./);
  assert.match(portugueseEntryPage, /noindex,nofollow/);
  assert.match(portugueseIndex, /Projeto Candidato de Prévia/);
  assert.match(portugueseEntryPage, /Registro Candidato de Prévia/);
  assert.match(portugueseIndex, /10\+ anos · 1 experiência/);
  assert.match(portugueseIndex, /href="\/review\/_astro\/[^\"]+\.css"/);
  assert.match(portugueseIndex, /href="\/review\/pt-br\/#experience"/);
  assert.equal(robots, 'User-agent: *\nDisallow: /\n');
  assert.equal(dataset.preview, true);
  assert.equal(dataset.projects[0]?.id, 'preview-project');
  assert.equal(dataset.projects[0]?.workContext, 'professional');
  assert.ok(index.indexOf('data-project-slug="preview-project"') < index.indexOf('data-project-slug="career-ledger"'));
  assert.ok(portugueseIndex.indexOf('data-project-slug="preview-project"') < portugueseIndex.indexOf('data-project-slug="career-ledger"'));
  assert.ok(dataset.resume);
  assert.ok(dataset.activityMix);
  assert.equal(dataset.resume.experienceYears, 10);
  assert.equal(dataset.activityMix.activityCount, 1);
  assert.equal(dataset.activityMix.basis, 'recorded-activities');
  assert.match(index, /1 recorded activity\./);
  assert.match(index, /not hours worked\. Each activity counts once, split across its areas\./);
  assert.match(index, /id="project-work-chart-preview-project"/);
  assert.doesNotMatch(index, /id="project-work-chart-career-ledger"/);
  assert.match(index, /Recorded activity mix/);
  assert.match(index, /62\.5%/);
  assert.match(portugueseIndex, /Distribuição das atividades registradas/);
  assert.match(portugueseIndex, /62,5%/);
  assert.match(portugueseIndex, /4 atividades registradas/);
  const ownerRow = index.match(/data-project-slug="owner-estimate-project"[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.match(ownerRow, /My contribution/);
  assert.match(ownerRow, /My estimate\./);
  assert.match(ownerRow, /35%/);
  assert.doesNotMatch(ownerRow, /recorded activities\./);
  assert.match(portugueseIndex, /Minha atuação/);
  assert.match(portugueseIndex, /Minha estimativa\./);
  const ownerDetail = await fs.readFile(path.join(distDir, 'projects', 'owner-estimate-project', 'index.html'), 'utf8');
  assert.match(ownerDetail, /My estimate\./);
  assert.doesNotMatch(ownerDetail, /Each activity counts once|recorded activities\./);
  assert.doesNotMatch(ownerDetail, /Owner-provided estimate|class="record-note"/);
  const ownerMix = dataset.projects.find((item) => item.id === 'owner-estimate-project')?.activityMix;
  assert.equal(ownerMix?.basis, 'owner-estimate');
  assert.ok(ownerMix && !('activityCount' in ownerMix));
  assert.equal(dataset.entries.find((item) => item.id === 'preview-entry')?.publication.status, 'candidate');
  assert.deepEqual(dataset.projects.find((item) => item.id === 'owner-estimate-project')?.publication, publication);
  assert.ok(result.files.includes('projects/preview-project/index.html'));
  assert.ok(result.files.includes('pt-br/projects/preview-project/index.html'));
  const projectPage = await fs.readFile(path.join(distDir, 'projects', 'preview-project', 'index.html'), 'utf8');
  const localizedProject = await fs.readFile(path.join(distDir, 'pt-br', 'projects', 'preview-project', 'index.html'), 'utf8');
  assert.match(projectPage, /Not published\. Waiting for your approval\./);
  assert.match(projectPage, /noindex,nofollow/);
  assert.match(projectPage, /4 recorded activities\./);
  assert.doesNotMatch(projectPage, /class="record-note"|sanitized for review/);
  assert.match(index, /src="\/review\/assets\/review\/sample.webp"/);
  assert.match(projectPage, /Interface views/);
  assert.match(projectPage, /href="\/review\/assets\/review\/sample.webp"/);
  assert.match(localizedProject, /Interfaces do projeto/);
  assert.match(localizedProject, /Interface de exemplo do produto para revisão visual/);
  assert.match(localizedProject, /Página de origem/);
  assert.match(projectPage, /Captured locally/);
  assert.match(projectPage, /Project image selected/);
  assert.match(localizedProject, /Capturada localmente em/);
  assert.match(localizedProject, /Imagem do projeto selecionada em/);
  assert.equal(dataset.reviewMedia?.['preview-project']?.[0]?.source.kind, 'web');
  assert.deepEqual(dataset.reviewMedia?.['preview-project']?.slice(1).map((image) => image.source), [
    { kind: 'local-capture', capturedAt: '2026-08-27' },
    { kind: 'project-asset', collectedAt: '2026-08-27' }
  ]);
  assert.doesNotMatch(JSON.stringify(dataset.reviewMedia), /approval|localizations|sourcePath|\.career/);
  assert.deepEqual(await fs.readFile(path.join(distDir, 'assets', 'review', 'sample.webp')), REVIEW_WEBP);
});
