import type { CareerDataset } from '../scripts/lib/model.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildSite, verifyGeneratedLinks } from '../scripts/lib/build.ts';
import { createPublicDataset } from '../scripts/lib/content.ts';
import { PATHS } from '../scripts/lib/constants.ts';

test('static build works under a GitHub project-page base path', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'career-ledger-build-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));

  const result = await buildSite({
    distDir: directory,
    siteUrl: 'https://engineer.example',
    basePath: '/career-ledger'
  });

  const index = await fs.readFile(path.join(directory, 'index.html'), 'utf8');
  const portugueseIndex = await fs.readFile(path.join(directory, 'pt-br', 'index.html'), 'utf8');
  const timeline = await fs.readFile(path.join(directory, 'timeline', 'index.html'), 'utf8');
  const portugueseTimeline = await fs.readFile(path.join(directory, 'pt-br', 'timeline', 'index.html'), 'utf8');
  const about = await fs.readFile(path.join(directory, 'about', 'index.html'), 'utf8');
  const portugueseAbout = await fs.readFile(path.join(directory, 'pt-br', 'about', 'index.html'), 'utf8');
  const portugueseProject = await fs.readFile(path.join(directory, 'pt-br', 'projects', 'career-ledger', 'index.html'), 'utf8');
  const dataset = JSON.parse(await fs.readFile(path.join(directory, 'data', 'career.json'), 'utf8'));
  const portugueseDataset: CareerDataset = JSON.parse(await fs.readFile(path.join(directory, 'pt-br', 'data', 'career.json'), 'utf8'));

  assert.match(index, /href="\/career-ledger\/_astro\/[^\"]+\.css"/);
  assert.match(index, /href="#work"/);
  const heroHeading = index.match(/<h1 id="portfolio-heading"[^>]*>([\s\S]*?)<\/h1>/);
  const heroHeadingText = heroHeading?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(heroHeadingText, 'I build complex web products from interface to infrastructure.');
  assert.match(index, /10\+ years building product experiences, platforms, and the systems behind them\./);
  assert.match(index, /data-record-mode="public"/);
  assert.ok(index.includes(`<time datetime="${dataset.updatedAt}">`));
  assert.doesNotMatch(index, /Local preview|Not published/);
  assert.match(index, />My work</);
  assert.match(index, /Andrews — Software Engineering Portfolio/);
  assert.match(index, /hreflang="pt-BR" href="https:\/\/engineer\.example\/career-ledger\/pt-br\/"/);
  assert.match(index, /id="work"/);
  assert.match(index, /<h2 id="work-heading">Projects I(?:'|&#39;)ve worked on\.<\/h2>/);
  assert.match(index, /<h2 id="principles-heading">How I work\.<\/h2>/);
  assert.match(index, /class="project-index"/);
  assert.match(index, /class="project-row project-row--flagship"/);
  assert.doesNotMatch(index, /data-score|work-archive/);
  assert.match(index, /class="project-stack" aria-label="Project technologies and AI"/);
  assert.doesNotMatch(index, /project-row__areas/);
  assert.match(index, /href="\/career-ledger\/projects\/"[^>]*>\s*<span>View all projects/);
  assert.match(index, /project-work-chart/);
  assert.match(portugueseIndex, /project-work-chart/);
  assert.doesNotMatch(index, /Technologies by area/);
  assert.doesNotMatch(portugueseIndex, /Tecnologias por área/);
  assert.match(index, /class="project-layers" aria-label="Engineering scope"/);
  assert.doesNotMatch(index, /Filled nodes indicate/);
  assert.match(index, />Results</);
  assert.match(index, /href="\/career-ledger\/projects\/career-ledger\/"/);
  assert.doesNotMatch(index, /<details class="project-story"/);
  assert.doesNotMatch(index, /<h1[^>]*>Career Ledger<\/h1>/);
  assert.doesNotMatch(index, /data-theme-toggle/);
  assert.match(index, /id="experience"/);
  assert.doesNotMatch(index, /class="ledger-stats"/);
  assert.doesNotMatch(index, />Areas of work</);
  assert.doesNotMatch(index, />Publishing method</);
  assert.match(timeline, /data-timeline-filter-group="significance"/);
  assert.match(timeline, /data-significance="activity"/);
  assert.match(timeline, />Filter by significance</);
  assert.ok(result.files.includes('entries/career-ledger-foundation/index.html'));
  assert.ok(result.files.includes('pt-br/entries/career-ledger-foundation/index.html'));
  assert.ok((await fs.stat(path.join(directory, 'pt-br', '404.html'))).isFile());
  assert.equal(dataset.profile.name, 'Andrews');
  assert.equal(dataset.locale, 'en');
  assert.equal(dataset.activityMix, undefined);
  assert.equal(dataset.preview, undefined);
  assert.doesNotMatch(JSON.stringify(dataset), /"(?:score|signals|prominence)":/);
  assert.equal(dataset.reviewMedia, undefined);
  assert.equal(dataset.reviewPortraits, undefined);
  assert.match(index, /id="recommendations"/);
  assert.equal(dataset.resume.recommendations.length, 6);
  assert.equal(dataset.resume.activityMix.basis, 'recorded-activities');
  assert.equal(dataset.projects.length, 16);
  assert.equal(dataset.entries.length, 14);
  assert.match(index, /href="mailto:andrews.ribeiro.gomes@gmail.com"/);
  assert.match(index, /href="https:\/\/wa.me\/5521981392924"/);
  assert.equal(result.files.filter(file => file.startsWith('assets/projects/')).length, 19);
  assert.equal(result.files.filter(file => file.startsWith('assets/portraits/')).length, 6);
  assert.ok(!result.files.some((file) => file.startsWith('assets/review/')));
  assert.ok(result.javascript.main < 90_000);
  assert.ok(result.javascript.architecture > 0 && result.javascript.architecture < 180_000);
  assert.doesNotMatch(JSON.stringify(dataset), /localizations/);
  assert.match(portugueseIndex, /<html lang="pt-BR"[^>]*>/);
  assert.match(portugueseIndex, /href="\/career-ledger\/_astro\/[^\"]+\.css"/);
  assert.match(portugueseIndex, /href="#work"/);
  const portugueseHeroHeading = portugueseIndex.match(/<h1 id="portfolio-heading"[^>]*>([\s\S]*?)<\/h1>/);
  const portugueseHeroHeadingText = portugueseHeroHeading?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(portugueseHeroHeadingText, 'Construo produtos web complexos, da interface à infraestrutura.');
  assert.match(portugueseIndex, /Mais de 10 anos construindo experiências de produto, plataformas e os sistemas por trás delas\./);
  assert.match(portugueseIndex, /<h2 id="work-heading">Projetos em que trabalhei\.<\/h2>/);
  assert.match(portugueseIndex, /<h2 id="principles-heading">Como eu trabalho\.<\/h2>/);
  assert.match(portugueseProject, /Fundação do Career Ledger/);
  assert.match(portugueseIndex, /class="project-stack" aria-label="Tecnologias e IA do projeto"/);
  assert.match(portugueseProject, /Arquitetura de Sistemas/);
  assert.match(portugueseProject, /Sobre o projeto/);
  assert.match(portugueseTimeline, />Filtrar por significância</);
  assert.match(portugueseTimeline, />Atividade/);
  assert.match(about, /<h1>I(?:'|&#39;)m Andrews\.<\/h1>/);
  assert.match(about, /How I contribute/);
  assert.match(about, /Take a look at my work\./);
  assert.doesNotMatch(about, /Publishing principles/);
  assert.doesNotMatch(about, /From evidence to a public record/);
  assert.match(portugueseAbout, /<h1>Sou o Andrews\.<\/h1>/);
  assert.match(portugueseAbout, /Como eu contribuo/);
  assert.doesNotMatch(portugueseAbout, /Princípios de publicação/);
  assert.doesNotMatch(portugueseAbout, /Da evidência ao registro público/);
  for (const file of result.files.filter((file) => file.endsWith('.html'))) {
    const html = await fs.readFile(path.join(directory, file), 'utf8');
    assert.doesNotMatch(html, /class="record-note"|Owner-provided estimate|Estimativa informada pelo autor|This record was selected and sanitized|Este registro foi selecionado e revisado antes da publicação/);
  }
  assert.equal(portugueseDataset.locale, 'pt-BR');
  assert.equal(portugueseDataset.profile.headline, 'Engenheiro de Software Full-Stack Sênior');
  assert.equal(portugueseDataset.taxonomy.areas.find((area) => area.slug === 'system-design')?.label, 'Arquitetura de Sistemas');
  assert.doesNotMatch(JSON.stringify(portugueseDataset), /localizations/);
  assert.deepEqual(await verifyGeneratedLinks(directory, { basePath: '/career-ledger' }), []);
});

test('injected candidates cannot enter public dist or bypass the preview flag', async () => {
  const data = await createPublicDataset();
  await assert.rejects(buildSite({ data }), /reserved for isolated candidate previews/);
  await assert.rejects(buildSite({ data: { ...data, reviewPortraits: {} } }), /reserved for isolated candidate previews/);
  await assert.rejects(buildSite({ data: { ...data, preview: true } }), /cannot be written into public dist/);
  await assert.rejects(buildSite({ data: { ...data, preview: true }, distDir: path.join(PATHS.dist, 'review') }), /cannot be written into public dist/);
  await assert.rejects(buildSite({ reviewAssets: [{ src: 'assets/review/sample.webp', bytes: new Uint8Array() }] }), /reserved for isolated candidate previews/);
});

test('a generated privacy finding cannot replace the last verified output', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'career-failed-build-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  await fs.writeFile(path.join(directory, 'last-good.txt'), 'last verified build');
  const data = await createPublicDataset();
  data.preview = true;
  data.profile.intro = ['C:', 'Users', 'private', 'repository'].join(String.fromCharCode(92));
  await assert.rejects(buildSite({ data, distDir: directory }), /Generated site privacy audit failed/);
  assert.equal(await fs.readFile(path.join(directory, 'last-good.txt'), 'utf8'), 'last verified build');
  await assert.rejects(fs.access(path.join(directory, 'index.html')));
});
