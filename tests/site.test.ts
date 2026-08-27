import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

const stylesUrl = new URL('../src/styles/global.css', import.meta.url);

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
