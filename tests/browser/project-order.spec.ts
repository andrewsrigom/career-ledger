import { expect, test } from '@playwright/test';
import type { CareerDataset } from '../../scripts/lib/model';
import { rankProjects } from '../../scripts/lib/project-ranking';

test('home and project directory preserve canonical order in both languages without JavaScript', async ({ browser, baseURL }) => {
  if (!baseURL) throw new Error('Expected browser base URL');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    const data: CareerDataset = await (await context.request.get(new URL('data/career.json', baseURL).href)).json();
    const ranked = rankProjects(data);
    expect(ranked.map((item) => item.project.id)).toEqual(data.projects.map((item) => item.id));
    expect(JSON.stringify(data)).not.toMatch(/"(?:score|signals|prominence)":/);
    for (const languagePath of ['', 'pt-br/']) {
      const homeUrl = new URL(languagePath, baseURL);
      await page.goto(homeUrl.href);
      await expect(page.locator('[data-project-row]')).toHaveCount(data.projects.length);
      expect(await page.locator('[data-project-row]').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-project-slug'))))
        .toEqual(data.projects.map((project) => project.slug));
      await expect(page.locator('.work-archive, [data-archive-row], [data-score]')).toHaveCount(0);
      await expect(page.locator('[data-project-slug]')).toHaveCount(data.projects.length);
      await expect(page.locator('.work-index-heading')).toContainText(String(data.projects.length).padStart(2, '0'));
      for (const { project, prominence } of ranked) {
        const row = page.locator(`[data-project-slug="${project.slug}"]`);
        await expect(row).toHaveClass(new RegExp(`project-row--${prominence}`));
        await expect(row.locator('.project-row__identity > p')).not.toBeEmpty();
        const hasImage = Boolean(data.preview && data.reviewMedia?.[project.id]?.length || project.presentation?.preview.kind === 'image');
        await expect(row.locator('.project-preview img')).toHaveCount(hasImage ? 1 : 0);
        if (!hasImage && !project.presentation && prominence !== 'flagship') await expect(row.locator('.project-preview')).toHaveCount(0);
        if (hasImage) await expect(row.locator('.project-preview img')).toBeVisible();
      }
      const lastLink = page.locator('.project-row__link').last();
      await lastLink.focus();
      await lastLink.press('Enter');
      await expect(page).toHaveURL(new URL(`projects/${data.projects.at(-1)!.slug}/`, homeUrl).href);
      await page.goBack();
      const firstLink = page.locator('.project-row__link').first();
      await firstLink.focus();
      await expect(firstLink).toBeFocused();
      await firstLink.press('Enter');
      await expect(page.locator('h1')).toBeVisible();
      await page.goto(new URL('projects/', homeUrl).href);
      expect(await page.locator('.directory-project > a').evaluateAll((links) => links.map((link) => link.getAttribute('href'))))
        .toEqual(data.projects.map((project) => new URL(`projects/${project.slug}/`, homeUrl).pathname));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  } finally {
    await context.close();
  }
});

test('project hierarchy keeps meaningful rows and visual evidence on desktop and mobile', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    const layout = await page.locator('[data-project-row]').evaluateAll((rows) => rows.map((row) => {
      const bounds = row.getBoundingClientRect();
      const heading = row.querySelector('h3')!;
      const summary = row.querySelector('.project-row__identity > p')!;
      const visual = row.querySelector('.project-preview');
      const titleBounds = heading.getBoundingClientRect();
      const visualBounds = visual?.getBoundingClientRect();
      return {
        treatment: row.className,
        titleSize: Number.parseFloat(getComputedStyle(heading).fontSize),
        summaryLength: summary.textContent?.trim().length ?? 0,
        titleFits: titleBounds.left >= bounds.left && titleBounds.right <= bounds.right + 1,
        visualFits: !visualBounds || visualBounds.left >= bounds.left && visualBounds.right <= bounds.right + 1,
        fitsPage: bounds.left >= 0 && bounds.right <= document.documentElement.clientWidth + 1
      };
    }));
    for (const row of layout) {
      expect(row.summaryLength).toBeGreaterThanOrEqual(30);
      expect(row.titleFits && row.visualFits && row.fitsPage).toBe(true);
    }
    const flagship = layout.find((row) => row.treatment.includes('--flagship'))!;
    const standard = layout.find((row) => row.treatment.includes('--standard'));
    const compact = layout.find((row) => row.treatment.includes('--compact'));
    if (standard) expect(flagship.titleSize).toBeGreaterThan(standard.titleSize);
    if (standard && compact) expect(standard.titleSize).toBeGreaterThan(compact.titleSize);
    if (width !== 320) {
      for (const treatment of ['featured', 'standard', 'compact']) {
        const row = page.locator(`.project-row--${treatment}`).first();
        if (await row.count()) {
          await row.scrollIntoViewIfNeeded();
          await row.screenshot({ path: testInfo.outputPath(`project-${treatment}-${width}.png`) });
        }
      }
    }
  }
});
