import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

declare global {
  interface Window {
    // Test-only instrumentation, installed before the application loads.
    __careerTestDrawCalls: number;
  }
}

async function expectUnclippedHeadline(page: Page) {
  await expect(page.locator('.hero-word')).not.toHaveCount(0);
  await expect.poll(() => page.locator('.hero-word > span').evaluateAll((words) => words.every((word) => {
    const mask = word.parentElement?.getBoundingClientRect();
    const text = word.getBoundingClientRect();
    return mask !== undefined && text.height > 0
      && text.top >= mask.top - 1 && text.bottom <= mask.bottom + 1
      && text.left >= mask.left - 1 && text.right <= mask.right + 1;
  })), { message: 'The headline words must be inside their clipping masks, not just present in the DOM.' }).toBe(true);
}

async function expectEvidenceInFlow(page: Page) {
  const row = page.locator('[data-project-row]').first();
  const preview = row.locator('.project-preview');
  await expect(preview).toHaveCSS('opacity', '1');
  await expect(preview).toHaveCSS('position', 'static');
  expect(await row.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const visual = element.querySelector('.project-preview')!.getBoundingClientRect();
    const result = element.querySelector('.project-row__signal')?.getBoundingClientRect();
    return visual.width > 0 && visual.height > 0 && visual.left >= bounds.left
      && visual.right <= bounds.right + 1 && visual.top >= bounds.top
      && visual.bottom <= bounds.bottom && (!result || result.top >= visual.bottom);
  }), 'Evidence stays in the project grid and never covers the result.').toBe(true);
}

test('desktop headline words finish visibly inside their masks in both languages', async ({ page }) => {
  for (const route of ['./', './pt-br/']) {
    await page.goto(route);
    await expectUnclippedHeadline(page);
  }
});

test('headline remains readable when the motion chunk cannot load', async ({ page }) => {
  await page.route(/\/motion\.[^/]+\.js$/, (route) => route.abort());
  await page.goto('./');
  await expectUnclippedHeadline(page);
  await page.getByRole('button', { name: 'Systems', exact: true }).focus();
  await expect(page.locator('[data-hero]')).toHaveAttribute('data-active-layer', '2');
});

test('hero hierarchy fits desktop, laptop, tablet and narrow phones in both languages', async ({ page }, testInfo) => {
  for (const width of [1920, 1440, 1280, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width > 820 ? 900 : 844 });
    for (const route of ['./', './pt-br/']) {
      await page.goto(route);
      await expectUnclippedHeadline(page);
      const geometry = await page.locator('.hero').evaluate((hero) => {
        const title = hero.querySelector('h1')!;
        const heading = title.getBoundingClientRect();
        const summary = hero.querySelector('.hero__summary')!.getBoundingClientRect();
        const actions = hero.querySelector('.hero__actions')!.getBoundingClientRect();
        const ribbon = hero.querySelector('.hero-ribbon')!.getBoundingClientRect();
        const fontSize = Number.parseFloat(getComputedStyle(title).fontSize);
        return {
          ordered: heading.bottom < summary.top && summary.bottom < actions.top && actions.bottom < ribbon.top,
          pageFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          wordsFit: [...title.querySelectorAll('.hero-word')].every((word) => word.getBoundingClientRect().right <= document.documentElement.clientWidth),
          lines: [...title.querySelectorAll('.hero-line')].map((line) => line.getBoundingClientRect().height / fontSize)
        };
      });
      expect(geometry.ordered).toBe(true);
      expect(geometry.pageFits).toBe(true);
      expect(geometry.wordsFit).toBe(true);
      if (width >= 1280) expect(geometry.lines.every((height) => height < 1.2), `${route} at ${width}px keeps the three intentional lines`).toBe(true);
      if (width <= 390) expect(geometry.lines[0], `${route} at ${width}px uses two opening lines`).toBeLessThan(2.2);
      if (width === 1440 || width === 390) {
        await page.screenshot({ path: testInfo.outputPath(`hero-${width}-${route.includes('pt-br') ? 'pt' : 'en'}.png`) });
      }
    }
  }
});

test('layer hover, focus and keyboard navigation share one diagram selection', async ({ page }) => {
  await page.goto('./');
  const hero = page.locator('[data-hero]');
  const layers = page.locator('[data-hero-layer]');
  await expect(layers.first()).toHaveAttribute('aria-pressed', 'true');
  await layers.nth(1).hover();
  await expect(hero).toHaveAttribute('data-active-layer', '1');
  await expect(page.locator('[data-scene-layer="1"]')).toHaveClass(/is-current/);
  await layers.nth(2).focus();
  await expect(hero).toHaveAttribute('data-active-layer', '2');
  await expect(layers.nth(2)).toHaveCSS('outline-style', 'solid');
  await layers.nth(2).press('ArrowRight');
  await expect(layers.nth(3)).toBeFocused();
  await expect(hero).toHaveAttribute('data-active-layer', '3');
  await expect(layers.nth(3)).toHaveAttribute('aria-pressed', 'true');
  await layers.nth(3).press('Home');
  await expect(layers.first()).toBeFocused();
  await expect(hero).toHaveAttribute('data-active-layer', '0');
  await layers.first().press('End');
  await expect(layers.nth(3)).toBeFocused();
  await expect(page.locator('[data-hero-layer][aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator('[data-scene-layer].is-current')).toHaveCount(1);
  await layers.nth(1).click();
  await layers.nth(2).hover();
  await expect(hero).toHaveAttribute('data-active-layer', '2');
  await page.mouse.move(0, 0);
  await expect(hero).toHaveAttribute('data-active-layer', '1');
});

test('scroll reveals the four layers while the diagram remains in view', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('./');
  const hero = page.locator('[data-hero]');
  await expect(hero).toHaveAttribute('data-active-layer', '0');
  const initialOpacity = await page.locator('.hero__scene').evaluate((element) => Number(getComputedStyle(element).opacity));
  const seen = new Set(['0']);
  const end = await hero.evaluate((element) => element.getBoundingClientRect().bottom + window.scrollY - 280);
  for (let offset = 100; offset < end; offset += 100) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), offset);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    // Wait for the native coalesced scroll frame, not a timed visual effect.
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    seen.add((await hero.getAttribute('data-active-layer'))!);
  }
  expect([...seen]).toEqual(['0', '1', '2', '3']);
  await expect(page.locator('.hero-ribbon')).toBeInViewport();
  await expect(page.locator('.architecture-scene')).toBeInViewport();
  const finalOpacity = await page.locator('.hero__scene').evaluate((element) => Number(getComputedStyle(element).opacity));
  expect(finalOpacity).toBeGreaterThan(initialOpacity);
  expect(finalOpacity).toBeLessThanOrEqual(.65);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(hero).toHaveAttribute('data-active-layer', '0');
});

test('reduced motion and touch retain layer selection without animation bundles', async ({ browser, baseURL }) => {
  if (!baseURL) throw new Error('The browser test server must provide a base URL.');
  for (const options of [{ reducedMotion: 'reduce' as const }, { hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } }]) {
    const context = await browser.newContext(options);
    try {
      const page = await context.newPage();
      const enhancements: string[] = [];
      page.on('request', (request) => { if (/\/(motion|architecture-scene)\.[^/]+\.js$/.test(request.url())) enhancements.push(request.url()); });
      await page.goto(baseURL);
      const button = page.getByRole('button', { name: 'Infrastructure', exact: true });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('[data-scene-layer="3"]')).toHaveClass(/is-current/);
      await expect(page.locator('.architecture-scene__canvas canvas')).toHaveCount(0);
      expect(enhancements).toEqual([]);
      if ('reducedMotion' in options) {
        await page.locator('.hero__cta').first().focus();
        await page.evaluate(() => window.scrollTo({ top: 250, behavior: 'instant' }));
        await expect(page.locator('[data-hero]')).toHaveAttribute('data-progress', '0');
      }
    } finally { await context.close(); }
  }
});

test('project evidence is visible at rest and remains in the grid on focus and hover', async ({ page }, testInfo) => {
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('./');
    const row = page.locator('[data-project-row]').first();
    await row.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await expectEvidenceInFlow(page);
    if (width === 1440 || width === 390) await row.screenshot({ path: testInfo.outputPath(`selected-work-${width}.png`) });
    const link = row.locator('.project-row__link');
    await link.focus();
    await expectEvidenceInFlow(page);
    await link.hover();
    await expectEvidenceInFlow(page);
    await expect(row.locator('.project-layers')).toBeVisible();
    await expect(row.locator('.project-layers li')).not.toHaveCount(0);
    const chart = row.locator('.project-work-chart');
    if (await chart.count()) {
      await expect(chart).toBeVisible();
      const chartGeometry = await chart.evaluate((element) => [...element.querySelectorAll('li')].map((item) => {
        const label = item.querySelector('.project-work-chart__label')!;
        const track = item.querySelector('.project-work-chart__track')!;
        return { fontSize: Number.parseFloat(getComputedStyle(label).fontSize), trackHeight: track.getBoundingClientRect().height, trackWidth: track.getBoundingClientRect().width };
      }));
      for (const geometry of chartGeometry) {
        expect(geometry.fontSize).toBeGreaterThanOrEqual(14);
        expect(geometry.trackHeight).toBeGreaterThanOrEqual(10);
        expect(geometry.trackWidth).toBeGreaterThan(40);
      }
    }
    await expect(row.locator('.project-row__signal')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

test('preference and viewport changes dispose enhancements without losing the layer controls', async ({ page }) => {
  await page.goto('./');
  const hero = page.locator('[data-hero]');
  await expect(hero).toHaveAttribute('data-architecture', /ready|fallback/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.architecture-scene__canvas canvas')).toHaveCount(0);
  const nav = page.locator('.primary-nav a').first();
  await nav.hover();
  await expect(nav).toHaveCSS('transform', 'none');
  await page.getByRole('button', { name: 'Product', exact: true }).focus();
  await expect(hero).toHaveAttribute('data-active-layer', '1');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.architecture-scene__canvas canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'Systems', exact: true }).click();
  await expect(hero).toHaveAttribute('data-active-layer', '2');
  await page.setViewportSize({ width: 1280, height: 900 });
  await expectUnclippedHeadline(page);
  await expect(hero).toHaveAttribute('data-active-layer', '2');
});

test('mobile preserves readable layer controls and a simplified static diagram', async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('./');
    await page.addStyleTag({ content: 'html { scrollbar-gutter: stable; }' });
    await expect(page.locator('.hero-ribbon')).toBeVisible();
    await expect(page.locator('[data-hero-layer]')).toHaveCount(4);
    await expect(page.locator('.blueprint-grid')).toBeHidden();
    for (const layer of await page.locator('[data-hero-layer]').all()) {
      await expect(layer).toBeEnabled();
      await expect(layer.locator('.hero-ribbon__desc')).toBeVisible();
    }
    await expect(page.locator('.architecture-scene__fallback')).toBeVisible();
    await expect(page.locator('.architecture-scene__canvas canvas')).toHaveCount(0);
    await expectUnclippedHeadline(page);
    const diagramFits = await page.locator('.landscape__visual > svg').evaluate((element) =>
      element.getBoundingClientRect().right <= document.body.getBoundingClientRect().right + 1);
    expect(diagramFits, 'The full-width diagram must fit beside a reserved scrollbar gutter.').toBe(true);
    expect(await page.locator('.hero').evaluate((hero) => {
      const controls = [...hero.querySelectorAll('button, a')];
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth
        && controls.every((control) => control.getBoundingClientRect().height >= 44)
        && [...hero.querySelectorAll('.hero-ribbon strong, .hero__kicker')].every((element) => Number.parseFloat(getComputedStyle(element).fontSize) >= 12);
    })).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 400 });
  const layers = page.locator('[data-hero-layer]');
  await layers.first().focus();
  await layers.first().press('End');
  await expect(layers.last()).toBeFocused();
  await expect(layers.last()).toBeInViewport({ ratio: 1 });
});

test('static fallbacks keep headline words and layer text readable', async ({ browser, baseURL }) => {
  for (const options of [{ javaScriptEnabled: false }, { reducedMotion: 'reduce' as const }]) {
    const context = await browser.newContext({ ...options, viewport: { width: 1280, height: 900 } });
    try {
      const page = await context.newPage();
      if (!baseURL) throw new Error('The browser test server must provide a base URL.');
      await page.goto(baseURL);
      await expectUnclippedHeadline(page);
      await expect(page.locator('.hero-ribbon')).toBeVisible();
      for (const layer of await page.locator('[data-hero-layer]').all()) {
        await expect(layer).toHaveCSS('opacity', '1');
        await expect(layer.locator('.hero-ribbon__desc')).toBeVisible();
        if (options.javaScriptEnabled === false) await expect(layer).toBeDisabled();
        else await expect(layer).toBeEnabled();
      }
      const stack = page.locator('.project-stack').first();
      await stack.scrollIntoViewIfNeeded();
      await expect(stack).toBeVisible();
      await expect(stack.locator('li').first()).toHaveCSS('opacity', '1');
      await expect(page.locator('.project-row__link').first()).toHaveCSS('opacity', '1');
    } finally {
      await context.close();
    }
  }
});

test('project technology tags stay readable, aligned and clear of row dividers at every width', async ({ page }, testInfo) => {
  for (const width of [1440, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['./', './pt-br/']) {
      await page.goto(route);
      const row = page.locator('.project-row').filter({ has: page.locator('.project-stack') }).first();
      const stack = row.locator('.project-stack');
      await stack.scrollIntoViewIfNeeded();
      await expect(row.locator('.project-row__link')).toHaveCSS('opacity', '1');
      await expect(stack).toHaveCSS('opacity', '1');

      const layout = await row.evaluate((element) => {
        const stack = element.querySelector<HTMLElement>('.project-stack')!;
        const summary = element.querySelector<HTMLElement>('.project-row__identity > p')!;
        const rowBounds = element.getBoundingClientRect();
        const stackBounds = stack.getBoundingClientRect();
        const summaryBounds = summary.getBoundingClientRect();
        const tags = [...stack.querySelectorAll('li')];
        return {
          bottomSpace: rowBounds.bottom - stackBounds.bottom,
          summarySpace: stackBounds.top - summaryBounds.bottom,
          aligned: Math.abs(stackBounds.left - summaryBounds.left) <= 1,
          tagsFit: tags.every((tag) => {
            const bounds = tag.getBoundingClientRect();
            return bounds.left >= stackBounds.left - 1 && bounds.right <= stackBounds.right + 1;
          }),
          solidReadableTags: tags.every((tag) => {
            const style = getComputedStyle(tag);
            return Number.parseFloat(style.fontSize) >= 12 && Number(style.fontWeight) >= 600
              && style.opacity === '1' && style.backgroundColor !== 'rgba(0, 0, 0, 0)';
          }),
          pageFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth
        };
      });
      expect(layout.bottomSpace).toBeGreaterThanOrEqual(24);
      expect(layout.summarySpace).toBeGreaterThanOrEqual(16);
      expect(layout.aligned).toBe(true);
      expect(layout.tagsFit).toBe(true);
      expect(layout.solidReadableTags).toBe(true);
      expect(layout.pageFits).toBe(true);
      if (width === 1440 || width === 390) {
        await page.screenshot({ path: testInfo.outputPath(`stack-${width}-${route.includes('pt-br') ? 'pt' : 'en'}.png`) });
      }
    }
  }
});

test('WebGL renders finite changes and stops when idle or offscreen', async ({ page }) => {
  await page.addInitScript(() => {
    window.__careerTestDrawCalls = 0;
    const prototype = WebGL2RenderingContext.prototype;
    const drawElements = prototype.drawElements;
    const drawArrays = prototype.drawArrays;
    prototype.drawElements = function (...args: Parameters<typeof drawElements>) {
      window.__careerTestDrawCalls += 1;
      return drawElements.apply(this, args);
    };
    prototype.drawArrays = function (...args: Parameters<typeof drawArrays>) {
      window.__careerTestDrawCalls += 1;
      return drawArrays.apply(this, args);
    };
  });
  await page.goto('./');
  const hero = page.locator('[data-hero]');
  await expect(hero).toHaveAttribute('data-architecture', /ready|fallback/);
  test.skip(await hero.getAttribute('data-architecture') !== 'ready', 'WebGL2 unavailable; fallback is covered separately.');
  const drawCalls = () => page.evaluate(() => window.__careerTestDrawCalls);
  await expect.poll(drawCalls).toBeGreaterThan(0);
  const initialCalls = await drawCalls();
  // Longer than the old 3.4-second layer timer: idle drawing and cycling must both stop.
  await page.waitForTimeout(4000);
  expect(await drawCalls()).toBe(initialCalls);

  await page.mouse.move(600, 300);
  await expect.poll(drawCalls).toBeGreaterThan(initialCalls);
  const pointerCalls = await drawCalls();
  await page.waitForTimeout(300);
  expect(await drawCalls()).toBe(pointerCalls);

  await page.evaluate(() => {
    const bounds = document.querySelector('[data-hero]')!.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + bounds.top + (bounds.height - 320) * .35, behavior: 'instant' });
  });
  await expect(hero).toHaveAttribute('data-active-layer', '1');
  await expect.poll(drawCalls).toBeGreaterThan(pointerCalls);
  await page.waitForTimeout(1500);
  const scrollCalls = await drawCalls();
  await page.waitForTimeout(300);
  expect(await drawCalls()).toBe(scrollCalls);

  await page.locator('#landscape-heading').scrollIntoViewIfNeeded();
  await expect(hero).not.toBeInViewport();
  await page.waitForTimeout(300);
  const offscreenCalls = await drawCalls();
  await page.waitForTimeout(500);
  expect(await drawCalls()).toBe(offscreenCalls);
});

test('direct section and heading anchors stay readable when motion loads late', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const motionChunk = /\/motion\.[^/]+\.js$/;
  for (const route of ['./#landscape', './pt-br/#landscape-heading']) {
    let releaseMotion!: () => void;
    const motionGate = new Promise<void>((resolve) => { releaseMotion = resolve; });
    await page.route(motionChunk, async (request) => {
      await motionGate;
      await request.continue();
    });
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#landscape-heading')).toHaveCSS('opacity', '1');
      await expect(page.locator('#landscape-heading')).toBeInViewport();
    } finally {
      releaseMotion();
    }
    await expect(page.locator('html')).toHaveClass(/motion-loaded/);
    await expect(page.locator('.landscape__heading')).toHaveAttribute('data-motion-complete', 'true');
    await expect(page.locator('#landscape-heading')).toHaveCSS('opacity', '1');
    await expect(page.locator('#landscape-heading')).toBeInViewport();
    await page.unroute(motionChunk);
  }
});

test('editorial motion survives anchors, fast and reverse scroll, reload, history and resize', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => {
    // Chromium may abort its optional cross-document visual transition during
    // rapid navigation. The document/GSAP states below must still be readable.
    if (error.name === 'AbortError' && error.message === 'Transition was skipped') return;
    errors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error' || (message.type() === 'warning' && message.text().includes('GSAP'))) errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('./#landscape');
  await expect(page.locator('#landscape-heading')).toHaveCSS('opacity', '1');
  await expect(page.locator('#landscape-heading')).toBeInViewport();
  const visual = page.locator('.landscape__visual');
  await visual.scrollIntoViewIfNeeded();
  await expect(visual).toHaveAttribute('data-motion-complete', 'true');
  await expect(page.locator('[data-landscape-edge]').first()).toHaveCSS('stroke-dashoffset', '0px');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);

  // Go beyond every trigger in one frame, then read backwards.
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await expect(page.locator('.site-footer')).toBeInViewport();
  for (const selector of ['#toolbox-heading', '#principles-heading', '#experience-heading', '#work-heading']) {
    const heading = page.locator(selector);
    if (!await heading.count()) continue;
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toHaveCSS('opacity', '1');
  }

  await page.goto('./');
  const lastProject = page.locator('[data-project-row]').last();
  await lastProject.scrollIntoViewIfNeeded();
  await expect(lastProject.locator('.project-preview')).toHaveCSS('opacity', '1');
  const scrollBeforeReload = await page.evaluate(() => scrollY);
  await page.reload();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrollBeforeReload - 100);
  await expect(lastProject.locator('.project-row__link')).toHaveCSS('opacity', '1');
  await expect(lastProject.locator('.project-preview')).toHaveCSS('opacity', '1');
  await lastProject.locator('.project-row__link').click();
  await expect(page.locator('.detail-hero h1')).toBeVisible();
  await page.goBack();
  await expect(lastProject.locator('.project-preview')).toHaveCSS('opacity', '1');
  for (const width of [768, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await lastProject.scrollIntoViewIfNeeded();
    await expect(lastProject.locator('.project-row__link')).toHaveCSS('opacity', '1');
    await expect(lastProject.locator('.project-preview')).toHaveCSS('opacity', '1');
  }

  const experience = page.locator('[data-experience-row]').first();
  if (await experience.count()) {
    await experience.scrollIntoViewIfNeeded();
    await expect(experience.locator('.experience-timeline__body')).toHaveCSS('opacity', '1');
    await experience.locator('summary').click();
    await expect(experience.locator('details')).toHaveAttribute('open', '');
    await page.locator('#principles-heading').scrollIntoViewIfNeeded();
    await expect(page.locator('#principles-heading')).toHaveCSS('opacity', '1');
  }
  expect(errors).toEqual([]);
});
