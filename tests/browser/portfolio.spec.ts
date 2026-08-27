import { expect, test } from '@playwright/test';

const previewMode = process.env.CAREER_BROWSER_PREVIEW === '1';
const basePath = (process.env.CAREER_BROWSER_BASE_PATH ?? '').replace(/\/+$/, '');
const baseURL = `http://127.0.0.1:4399${basePath}/`;

test('homepage presents the editorial engineering narrative', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.goto('./');

  await expect(page.locator('h1')).toHaveText('I build complex web products from interface to infrastructure.');
  await expect(page.locator('[data-hero-layer]')).toHaveCount(4);
  expect(await page.locator('.project-row').count()).toBeGreaterThan(0);
  await expect(page.locator('#landscape-heading')).toBeVisible();
  await expect(page.locator('[data-hero]')).toHaveAttribute('data-architecture', /ready|fallback/);
  if (previewMode) await expect(page.locator('.preview-banner')).toContainText('Not published');
  else await expect(page.locator('.preview-banner')).toHaveCount(0);
  await expect(page.getByText('Publishing principles')).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test('project index works with keyboard and normal navigation', async ({ page }) => {
  await page.goto('./');
  const firstProject = page.locator('.project-row__link').first();
  await firstProject.focus();
  await expect(firstProject).toBeFocused();
  await expect(page.locator('.project-row').first()).toHaveClass(/is-previewing/);
  await expect(page.locator('.project-preview').first()).toHaveCSS('opacity', '1');
  const href = await firstProject.getAttribute('href');
  expect(href?.startsWith(`${basePath}/projects/`)).toBe(true);
  await firstProject.press('Enter');
  await expect(page.locator('.detail-hero h1')).toBeVisible();
  await expect(page.locator('.record-note')).toContainText(previewMode ? 'not public' : 'selected and sanitized');
});

test('mobile uses static architecture and inline project visuals', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await expect(page.locator('.architecture-scene__fallback')).toBeVisible();
  await expect(page.locator('.architecture-scene__canvas canvas')).toHaveCount(0);
  await expect(page.locator('.project-preview').first()).toBeVisible();
  await expect(page.locator('.section-progress')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 740 });
  const overflow = await page.evaluate(() => [...document.querySelectorAll('main *')]
    .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1)
    .slice(0, 12).map((element) => `${element.tagName}.${element.className}: ${element.getBoundingClientRect().right}`));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), overflow.join('\n')).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('mobile.png') });
});

test('reduced motion keeps all content visible without WebGL', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await expect(page.locator('[data-reveal]').first()).toBeVisible();
  await expect(page.locator('.architecture-scene__fallback')).toBeVisible();
  await expect(page.locator('.architecture-scene__canvas canvas')).toHaveCount(0);
});

test('core reading and navigation work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.project-row').first()).toBeVisible();
  await page.locator('.project-row__link').first().click();
  await expect(page.locator('.detail-hero h1')).toBeVisible();
  await context.close();
});

test('Portuguese routes preserve the same information architecture', async ({ page }) => {
  await page.goto('./pt-br/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('h1')).toHaveText('Construo produtos web complexos, da interface à infraestrutura.');
  expect(await page.locator('.project-row').count()).toBeGreaterThan(0);
  await expect(page.locator('#landscape-heading')).toBeVisible();
  await expect(page.locator('a[lang="en"]')).toHaveAttribute('href', `${basePath}/`);
});

test('WebGL failure leaves the architectural fallback intact', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: any[]) {
      if (type === 'webgl' || type === 'webgl2') return null;
      return original.call(this, type, ...args as []);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto('./');
  await expect(page.locator('[data-hero]')).toHaveAttribute('data-architecture', 'fallback');
  await expect(page.locator('.architecture-scene__fallback')).toBeVisible();
});

test('runtime requests stay on the local origin', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4399') externalRequests.push(request.url());
  });
  await page.goto('./');
  await expect(page.locator('[data-hero]')).toHaveAttribute('data-architecture', /ready|fallback/);
  await page.locator('.project-row__link').first().click();
  await expect(page.locator('.detail-hero')).toBeVisible();
  expect(externalRequests).toEqual([]);
});

test('timeline filters, language switch, and 404 are functional', async ({ page }) => {
  await page.goto('./timeline/');
  await page.locator('[data-timeline-search]').fill('no matching record xyz');
  await expect(page.locator('[data-timeline-empty]')).toBeVisible();
  await page.locator('[data-timeline-search]').fill('');
  await expect(page.locator('[data-timeline-empty]')).toBeHidden();
  await page.locator('a[lang="pt-BR"]').click();
  await expect(page).toHaveURL(/\/pt-br\/timeline\/$/);
  await page.goto('./pt-br/404.html');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('h1')).toBeVisible();
});

test('secondary pages remain readable at narrow mobile widths', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const route of ['projects/', 'projects/career-ledger/', 'areas/frontend-architecture/', 'entries/career-ledger-foundation/', 'about/', 'pt-br/about/']) {
    await page.goto(`./${route}`);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }
});
