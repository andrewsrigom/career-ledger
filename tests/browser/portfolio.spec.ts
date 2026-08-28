import { expect, test } from '@playwright/test';
import type { CareerDataset } from '../../scripts/lib/model.ts';
import { isPriorityTechnology, orderTechnologies } from '../../src/lib/technology-presentation.ts';
import { projectWorkItems } from '../../src/lib/project-presentation.ts';

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
  const recordBar = page.locator('.record-bar');
  await expect(recordBar).toHaveAttribute('data-record-mode', previewMode ? 'draft' : 'public');
  if (previewMode) {
    await expect(page.locator('.preview-banner')).toContainText('Not published');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
    await expect(recordBar.locator('time')).toHaveCount(0);
  } else {
    await expect(page.locator('.preview-banner')).toHaveCount(0);
    const data: CareerDataset = await (await page.request.get(`${baseURL}data/career.json`)).json();
    await expect(recordBar.locator('time')).toHaveAttribute('datetime', data.updatedAt);
    await expect(recordBar).toContainText('My work');
    await expect(recordBar.locator('time')).toHaveText(new Intl.DateTimeFormat('en-GB', {
      month: 'short', year: 'numeric', timeZone: 'UTC'
    }).format(new Date(`${data.updatedAt}T00:00:00Z`)));
  }
  await expect(page.locator('.hero__summary')).toHaveText('10+ years building product experiences, platforms, and the systems behind them.');
  await expect(page.locator('.hero__actions a').first()).toContainText('Selected work');
  await expect(page.locator('.primary-nav a').first()).toHaveAttribute('href', '#work');
  await expect(page.getByText('Publishing principles')).toHaveCount(0);
  await expect(page.locator('#work-heading')).toHaveText("Projects I've worked on.");
  await expect(page.locator('#principles-heading')).toHaveText('How I work.');
  await expect(page.getByText('Owner-provided estimate.', { exact: true })).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test('project index works with keyboard and normal navigation', async ({ page }) => {
  await page.goto('./');
  const firstProject = page.locator('.project-row__link').first();
  await firstProject.focus();
  await expect(firstProject).toBeFocused();
  await expect(firstProject).toBeInViewport();
  await expect(page.locator('.project-preview').first()).toHaveCSS('opacity', '1');
  await expect(firstProject).toHaveCSS('outline-style', 'solid');
  const href = await firstProject.getAttribute('href');
  expect(href?.startsWith(`${basePath}/projects/`)).toBe(true);
  await firstProject.press('Enter');
  await expect(page.locator('.detail-hero h1')).toBeVisible();
  await expect(page.locator('.record-note')).toHaveCount(0);
  if (previewMode) {
    await expect(page.locator('.preview-banner')).toContainText('Not published. Waiting for your approval.');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  } else {
    await expect(page.locator('.preview-banner')).toHaveCount(0);
  }
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
  const chart = page.locator('.project-work-chart').first();
  if (await chart.count()) {
    await expect(chart).toBeVisible();
    const bars = await chart.locator('i').evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
    expect(bars.length).toBeGreaterThan(0);
    expect(bars.every((width) => width > 0)).toBe(true);
  }
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
  await expect(page.locator('#work-heading')).toHaveText('Projetos em que trabalhei.');
  await expect(page.locator('#principles-heading')).toHaveText('Como eu trabalho.');
});

test('project stacks use recorded technologies and localized AI labels without inventing missing data', async ({ page }) => {
  for (const locale of ['en', 'pt-BR'] as const) {
    const prefix = locale === 'pt-BR' ? 'pt-br/' : '';
    await page.goto(`./${prefix}`);
    const response = await page.request.get(`${baseURL}${prefix}data/career.json`);
    expect(response.ok()).toBe(true);
    const data: CareerDataset = await response.json();
    const aiArea = data.taxonomy.areas.find((area) => area.slug === 'ai-engineering')?.label;
    const rows = page.locator('.project-row');

    for (const row of await rows.all()) {
      const slug = await row.getAttribute('data-project-slug');
      const project = data.projects.find((item) => item.slug === slug);
      if (!project) throw new Error(`Missing source project for ${slug}`);
      const hasAi = aiArea !== undefined && project.areas.includes(aiArea);
      const technologies = orderTechnologies(project.technologies);
      const expected = [
        ...technologies.slice(0, 4).map((technology) => technology === 'Model Context Protocol' ? 'MCP' : technology),
        ...(hasAi ? [locale === 'pt-BR' ? 'IA' : 'AI'] : [])
      ];

      await expect(row.locator('.project-row__identity .project-stack li:not(.project-stack__more)')).toHaveText(expected);
      await expect(row.locator('.project-stack__more')).toHaveCount(technologies.length > 4 ? 1 : 0);
      if (technologies.length > 4) await expect(row.locator('.project-stack__more > span[aria-hidden]')).toHaveText(`+${technologies.length - 4}`);
      await expect(row.locator('.project-stack')).toHaveCount(expected.length ? 1 : 0);
      await expect(row.locator('.project-stack__ai')).toHaveCount(hasAi ? 1 : 0);
      await expect(row.locator('.project-row__areas')).toHaveCount(0);
      if (expected.length) {
        await expect(row.locator('.project-stack')).toHaveAttribute('aria-label', locale === 'pt-BR' ? 'Tecnologias e IA do projeto' : 'Project technologies and AI');
      }
      if (technologies.slice(0, 4).includes('Model Context Protocol')) {
        await expect(row.locator('.project-stack abbr')).toHaveAttribute('title', 'Model Context Protocol');
      }
      const expanded = /project-row--(?:flagship|featured)/.test(await row.getAttribute('class') ?? '');
      const showChart = expanded || project.activityMix?.basis === 'owner-estimate';
      const workItems = showChart && project.activityMix ? projectWorkItems(project.activityMix) : [];
      const chart = row.locator('.project-work-chart');
      await expect(chart).toHaveCount(workItems.length ? 1 : 0);
      await expect(chart.locator('li')).toHaveCount(workItems.length);
      if (showChart && project.activityMix?.basis === 'owner-estimate') {
        await expect(chart.locator('.project-work-chart__sample')).toHaveText(locale === 'pt-BR' ? 'Minha estimativa.' : 'My estimate.');
      } else if (showChart && project.activityMix) {
        await expect(chart.locator('.project-work-chart__sample')).toContainText(String(project.activityMix.activityCount));
      }
      const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
      for (const [index, item] of workItems.entries()) {
        const bar = chart.locator('li').nth(index);
        await expect(bar).toHaveAttribute('data-work-area', item.area);
        await expect(bar.locator('.project-work-chart__percentage')).toHaveText(`${number.format(item.percentage)}%`);
        const actualWidth = await bar.locator('i').evaluate((element) => Number.parseFloat(element.style.getPropertyValue('--bar-size')));
        expect(actualWidth).toBeCloseTo(item.percentage);
      }
    }
    const core = orderTechnologies(data.technologies.map((technology) => technology.label)).filter(isPriorityTechnology);
    await expect(page.locator('.toolbox__core li')).toHaveText(core);
    const toolboxText = (await page.locator('.toolbox').innerText()).replace(/\s+/g, ' ');
    for (const technology of data.technologies) expect(toolboxText).toContain(technology.label);
    const overflowProject = data.projects.find((project) => project.technologies.length > 6) ?? data.projects[0]!;
    await page.goto(`./${prefix}projects/${overflowProject.slug}/`);
    await expect(page.locator('.detail-grid aside > div').first().locator('p')).toHaveText(orderTechnologies(overflowProject.technologies).join(' · '));
  }
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
    // Reserve the space taken by non-overlay scrollbars in desktop browsers.
    await page.addStyleTag({ content: 'html { scrollbar-gutter: stable; }' });
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth <= root.clientWidth && document.body.getBoundingClientRect().width <= root.getBoundingClientRect().width;
    }), route).toBe(true);
  }
});
