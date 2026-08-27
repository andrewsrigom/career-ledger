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
  assert.match(index, /<h1 id="portfolio-heading"[^>]*>I build complex web products from interface to infrastructure\.<\/h1>/);
  assert.match(index, /Senior full-stack engineering across products, platforms, and developer systems\./);
  assert.match(index, /Andrews — Software Engineering Portfolio/);
  assert.match(index, /hreflang="pt-BR" href="https:\/\/engineer\.example\/career-ledger\/pt-br\/"/);
  assert.match(index, /id="work"/);
  assert.match(index, /<h2 id="work-heading">Products shaped across layers\.<\/h2>/);
  assert.match(index, /class="project-index"/);
  assert.match(index, /class="project-row"/);
  assert.match(index, /href="\/career-ledger\/projects\/"[^>]*>\s*<span>View all projects/);
  assert.match(index, /Career Ledger Foundation/);
  assert.match(index, />Results</);
  assert.match(index, /href="\/career-ledger\/projects\/career-ledger\/"/);
  assert.doesNotMatch(index, /<details class="project-story"/);
  assert.doesNotMatch(index, /<h1[^>]*>Career Ledger<\/h1>/);
  assert.doesNotMatch(index, /data-theme-toggle/);
  assert.doesNotMatch(index, /id="experience"/);
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
  assert.ok(result.javascript.main < 90_000);
  assert.ok(result.javascript.architecture > 0 && result.javascript.architecture < 180_000);
  assert.doesNotMatch(JSON.stringify(dataset), /localizations/);
  assert.match(portugueseIndex, /<html lang="pt-BR"[^>]*>/);
  assert.match(portugueseIndex, /href="\/career-ledger\/_astro\/[^\"]+\.css"/);
  assert.match(portugueseIndex, /href="#work"/);
  assert.match(portugueseIndex, /Construo produtos web complexos, da interface à infraestrutura\./);
  assert.match(portugueseIndex, /<h2 id="work-heading">Produtos construídos entre diferentes camadas\.<\/h2>/);
  assert.match(portugueseIndex, /Fundação do Career Ledger/);
  assert.match(portugueseProject, /Arquitetura de Sistemas/);
  assert.match(portugueseProject, /Sobre o projeto/);
  assert.match(portugueseTimeline, />Filtrar por significância</);
  assert.match(portugueseTimeline, />Atividade/);
  assert.match(about, /Full-stack engineering with product depth\./);
  assert.match(about, /How I contribute/);
  assert.match(about, /See the systems behind the experience\./);
  assert.doesNotMatch(about, /Publishing principles/);
  assert.doesNotMatch(about, /From evidence to a public record/);
  assert.match(portugueseAbout, /Engenharia full-stack com profundidade de produto\./);
  assert.match(portugueseAbout, /Como eu contribuo/);
  assert.doesNotMatch(portugueseAbout, /Princípios de publicação/);
  assert.doesNotMatch(portugueseAbout, /Da evidência ao registro público/);
  assert.equal(portugueseDataset.locale, 'pt-BR');
  assert.equal(portugueseDataset.profile.headline, 'Engenheiro de Software Full-Stack Sênior');
  assert.equal(portugueseDataset.taxonomy.areas.find((area) => area.slug === 'system-design')?.label, 'Arquitetura de Sistemas');
  assert.doesNotMatch(JSON.stringify(portugueseDataset), /localizations/);
  assert.deepEqual(await verifyGeneratedLinks(directory, { basePath: '/career-ledger' }), []);
});

test('injected candidates cannot enter public dist or bypass the preview flag', async () => {
  const data = await createPublicDataset();
  await assert.rejects(buildSite({ data }), /reserved for isolated candidate previews/);
  await assert.rejects(buildSite({ data: { ...data, preview: true } }), /cannot be written into public dist/);
  await assert.rejects(buildSite({ data: { ...data, preview: true }, distDir: path.join(PATHS.dist, 'review') }), /cannot be written into public dist/);
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
