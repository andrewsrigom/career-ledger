import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function sampleHeaderTransition(page: Page, top: number) {
  return page.evaluate(async (target) => {
    const header = document.querySelector<HTMLElement>('[data-site-header]')!;
    const bar = document.querySelector<HTMLElement>('.record-bar')!;
    const main = document.querySelector('main')!;
    const samples = [];
    window.scrollTo({ top: target, behavior: 'instant' });
    const start = performance.now();
    // Observe the whole 350 ms transition and its resting state. A single
    // settled screenshot can miss a layout/scroll feedback loop.
    do {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      samples.push({
        scrollY: window.scrollY,
        headerTop: header.getBoundingClientRect().top,
        headerHeight: header.getBoundingClientRect().height,
        scrolled: header.dataset.scrolled === 'true',
        barBottom: bar.getBoundingClientRect().bottom,
        mainTop: main.getBoundingClientRect().top + window.scrollY
      });
    } while (performance.now() - start < 500);
    return samples;
  }, top);
}

for (const { width, reducedMotion } of [
  { width: 1280, reducedMotion: 'no-preference' },
  { width: 1280, reducedMotion: 'reduce' },
  { width: 768, reducedMotion: 'no-preference' },
  { width: 390, reducedMotion: 'reduce' }
] as const) {
  test(`header compaction preserves scroll and document flow at ${width}px with ${reducedMotion} motion`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion });

    for (const route of ['./', './pt-br/about/']) {
      await page.goto(route);
      const initial = await page.evaluate(() => ({
        barBottom: document.querySelector('.record-bar')!.getBoundingClientRect().bottom,
        headerHeight: document.querySelector('[data-site-header]')!.getBoundingClientRect().height,
        mainTop: document.querySelector('main')!.getBoundingClientRect().top + window.scrollY
      }));

      for (const top of [31, 33, 40, 90, 160, 40, 33, 32, 0]) {
        const samples = await sampleHeaderTransition(page, top);
        const message = `${route} at scroll ${top}px`;
        expect(samples.length, message).toBeGreaterThan(1);
        expect(Math.max(...samples.map((sample) => Math.abs(sample.scrollY - top))), message).toBeLessThanOrEqual(1);
        expect(Math.max(...samples.map((sample) => Math.abs(sample.mainTop - initial.mainTop))), message).toBeLessThanOrEqual(1);
        expect(Math.max(...samples.map((sample) => Math.abs(sample.barBottom - (initial.barBottom - top)))), message).toBeLessThanOrEqual(1);
        const changes = samples.filter((sample, index) => index > 0 && sample.scrolled !== samples[index - 1]!.scrolled);
        expect(changes.length, message).toBeLessThanOrEqual(1);
        const last = samples[samples.length - 1]!;
        expect(last.scrolled, message).toBe(top > 32);
        if (top === 160) {
          expect(last.headerTop, message).toBeCloseTo(0);
          if (width === 1280) expect(last.headerHeight, message).toBeLessThan(initial.headerHeight);
        }
        if (top === 0) expect(last.headerHeight, message).toBeCloseTo(initial.headerHeight);
      }
    }
  });
}
