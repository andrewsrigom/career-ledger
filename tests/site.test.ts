import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { recordedProjectLayers, projectWorkItems } from '../src/lib/project-presentation.ts';
import { orderTechnologies } from '../src/lib/technology-presentation.ts';
import { createPublicDataset } from '../scripts/lib/content.ts';
import { localizeCareerDataset } from '../scripts/lib/i18n.ts';
import { first } from './helpers.ts';

const stylesUrl = new URL('../src/styles/global.css', import.meta.url);

test('abstract preview layers follow recorded taxonomy in either language, not inferred skill', async () => {
  const data = await createPublicDataset();
  const selectedSlugs = new Set(['frontend-architecture', 'product-engineering', 'backend-architecture', 'cloud-infrastructure']);
  for (const locale of ['en', 'pt-BR'] as const) {
    const localized = localizeCareerDataset(data, locale);
    const project = first(localized.projects);
    const areas = localized.taxonomy.areas.filter((area) => selectedSlugs.has(area.slug));
    assert.deepEqual(recordedProjectLayers({ ...project, areas: areas.map((area) => area.label) }, localized.taxonomy), [true, true, true, true]);
    assert.deepEqual(recordedProjectLayers({ ...project, areas: [] }, localized.taxonomy), [false, false, false, false]);
    const backend = localized.taxonomy.areas.find((area) => area.slug === 'backend-architecture')!;
    assert.deepEqual(recordedProjectLayers({ ...project, areas: [backend.label] }, localized.taxonomy), [false, false, true, false]);
  }
});

test('technology order starts with the requested stack, deduplicates aliases, and keeps unknown tools', () => {
  const source = ['React', 'Custom tool', 'TypeScript', 'Python', 'Next.js', 'Node', 'node.js', 'Vue', 'PostgreSQL', 'AWS Lambda', 'Another tool'];
  const before = [...source];
  assert.deepEqual(orderTechnologies(source), ['Node', 'Python', 'TypeScript', 'Next.js', 'React', 'PostgreSQL', 'Vue', 'AWS Lambda', 'Custom tool', 'Another tool']);
  assert.deepEqual(source, before);
  assert.deepEqual(orderTechnologies(['Unknown', 'Another unknown']), ['Unknown', 'Another unknown']);
  assert.deepEqual(orderTechnologies([]), []);
});

test('work charts start with backend, preserve percentages and retain other recorded domains', () => {
  const mix = { basis: 'recorded-activities' as const, activityCount: 10, items: [
    { domain: 'frontend' as const, percentage: 40 }, { domain: 'backend' as const, percentage: 30 },
    { domain: 'infrastructure' as const, percentage: 10 }, { domain: 'devops' as const, percentage: 5 },
    { domain: 'data' as const, percentage: 15 }
  ] };
  const original = structuredClone(mix);
  assert.deepEqual(projectWorkItems(mix), [
    { area: 'backend', percentage: 30 }, { area: 'frontend', percentage: 40 },
    { area: 'devops', percentage: 15 }, { area: 'other', percentage: 15 }
  ]);
  assert.deepEqual(mix, original);
  assert.deepEqual(projectWorkItems({ ...mix, items: [{ domain: 'frontend', percentage: 100 }] }), [{ area: 'frontend', percentage: 100 }]);
});

function channelToLinear(channel: number) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const matches = hex.slice(1).match(/../g);
  assert.ok(matches && matches.length === 3, 'Expected an RGB hex color');
  const channels = matches.map((value) => Number.parseInt(value, 16));
  return (0.2126 * channelToLinear(channels[0]!))
    + (0.7152 * channelToLinear(channels[1]!))
    + (0.0722 * channelToLinear(channels[2]!));
}

function contrastRatio(first: string, second: string) {
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function readToken(block: string, name: string) {
  const match = block.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, 'i'));
  assert.ok(match, `missing --${name} color token`);
  assert.ok(match[1]);
  return match[1];
}

test('secondary text tokens meet WCAG AA contrast across theme surfaces', async () => {
  const source = await fs.readFile(stylesUrl, 'utf8');
  const light = source.match(/:root\s*\{([\s\S]*?)\}/)?.[1];
  const dark = source.match(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\}/)?.[1];

  assert.ok(light, 'missing light theme tokens');
  assert.ok(dark, 'missing dark theme tokens');

  for (const [theme, block] of [['light', light], ['dark', dark]] as const) {
    for (const foregroundName of ['muted', 'faint']) {
      for (const backgroundName of ['paper', 'paper-raised', 'paper-soft']) {
        const foreground = readToken(block, foregroundName);
        const background = readToken(block, backgroundName);
        const ratio = contrastRatio(foreground, background);
        assert.ok(
          ratio >= 4.5,
          `${theme} --${foregroundName} on --${backgroundName} has contrast ${ratio.toFixed(2)}:1`
        );
      }
    }
  }
});

test('hero ribbon text meets AA contrast on inactive and selected surfaces', async () => {
  const source = await fs.readFile(stylesUrl, 'utf8');
  const hero = source.match(/\n\.hero\s*\{([\s\S]*?)\}/)?.[1];
  assert.ok(hero, 'missing hero palette');

  for (const foregroundName of ['hero-ink', 'hero-muted', 'hero-accent']) {
    for (const backgroundName of ['hero-surface', 'hero-selected']) {
      const ratio = contrastRatio(readToken(hero, foregroundName), readToken(hero, backgroundName));
      assert.ok(ratio >= 4.5, `${foregroundName} on ${backgroundName} has contrast ${ratio.toFixed(2)}:1`);
    }
  }
});

test('project technology tags and AI accent meet AA contrast in both themes', async () => {
  const source = await fs.readFile(stylesUrl, 'utf8');
  const light = source.match(/:root\s*\{([\s\S]*?)\}/)?.[1];
  const dark = source.match(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\}/)?.[1];
  assert.ok(light);
  assert.ok(dark);

  for (const block of [light, dark]) {
    for (const foreground of ['ink', 'technical']) {
      const ratio = contrastRatio(readToken(block, foreground), readToken(block, 'paper-raised'));
      assert.ok(ratio >= 4.5, `${foreground} and paper-raised have contrast ${ratio.toFixed(2)}:1`);
    }
  }
});
