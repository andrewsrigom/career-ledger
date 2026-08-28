import { expect, test } from '@playwright/test';
import type { CareerDataset, ReviewImage } from '../../scripts/lib/model';

const basePath = (process.env.CAREER_BROWSER_BASE_PATH ?? '').replace(/\/+$/, '');

function galleries(data: CareerDataset): Array<[string, ReviewImage[]]> {
  return data.projects.flatMap(project => {
    const images = data.preview ? data.reviewMedia?.[project.id] ?? project.presentation?.gallery : project.presentation?.gallery;
    return images?.length ? [[project.id, images] as [string, ReviewImage[]]] : [];
  });
}

test('project screenshots render locally with translated captions and full-size keyboard links', async ({ page }, testInfo) => {
  const response = await page.request.get('./data/career.json', { timeout: 5_000 });
  const data: CareerDataset = await response.json();
  await page.goto('./');
  if (!data.preview) {
    expect(data.reviewMedia).toBeUndefined();
    await expect(page.locator('img[src*="/assets/review/"]')).toHaveCount(0);
  }
  const media = galleries(data);
  expect(media.length).toBeGreaterThan(0);
  // This one test visits every gallery in both languages. Scale the batch
  // budget with the collection while keeping individual operations bounded.
  test.setTimeout(testInfo.timeout + media.length * 5_000);
  for (const [id, images] of media) {
    const project = data.projects.find((item) => item.id === id);
    expect(project).toBeDefined();
    if (!project) throw new Error('Review media has no project');
    await page.goto(`./projects/${project.slug}/`, { timeout: 15_000 });
    await expect(page.locator('main')).not.toContainText(/not a claim of authorship|do not imply authorship|contribution is still being reviewed/);
    const gallery = page.locator('.project-gallery');
    await expect(gallery.locator('img')).toHaveCount(images.length);
    for (let index = 0; index < images.length; index++) {
      const image = images[index];
      if (!image) throw new Error('Missing image fixture');
      const element = gallery.locator('img').nth(index);
      await element.scrollIntoViewIfNeeded();
      await expect(element).toHaveAttribute('alt', image.alt);
      await expect.poll(() => element.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBe(image.width);
      await expect(element).toHaveAttribute('width', String(image.width));
      const link = gallery.locator('figure > a').nth(index);
      await link.focus();
      await expect(link).toBeFocused();
      await expect(link).toHaveAttribute('href', `${basePath}/${image.src}`);
      expect((await page.request.get(`${basePath}/${image.src}`, { timeout: 5_000 })).ok()).toBe(true);
      const sourceLink = gallery.locator('figcaption').nth(index).locator('a');
      if (image.source.kind === 'web' && image.source.url) {
        await expect(sourceLink).toHaveAttribute('href', image.source.url);
      } else {
        await expect(sourceLink).toHaveCount(0);
      }
    }
    await page.goto(`./pt-br/projects/${project.slug}/`, { timeout: 15_000 });
    await expect(page.locator('main')).not.toContainText(/sem atribuir autoria|não representam autoria|contribuição específica nesta página ainda está em revisão/);
    await expect(page.locator('.project-gallery h2')).toHaveText('Interfaces do projeto');
    await expect(page.locator('.project-gallery img')).toHaveCount(images.length);
    await expect(page.locator('.project-gallery img').first()).not.toHaveAttribute('alt', images[0]?.alt ?? '');
  }
});

test('review screenshots stay within the mobile layout without JavaScript', async ({ browser, baseURL }) => {
  if (!baseURL) throw new Error('Expected browser base URL');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    const data: CareerDataset = await (await context.request.get(new URL('data/career.json', baseURL).href)).json();
    await page.goto(baseURL);
    if (!data.preview) {
      expect(data.reviewMedia).toBeUndefined();
    }
    const media = galleries(data);
    for (const [id, images] of media) {
      const project = data.projects.find((item) => item.id === id);
      if (!project) throw new Error('Missing project');
      const homeImage = page.locator(`[data-project-slug="${project.slug}"] .project-preview img`);
      await expect(homeImage).toHaveCount(1);
      await homeImage.scrollIntoViewIfNeeded();
      await expect(homeImage).toBeVisible();
      await expect.poll(() => homeImage.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
      await expect(homeImage.locator('xpath=ancestor::figure').locator('figcaption')).toHaveText(images[0]!.caption);
    }
    const selected = media[0]?.[0];
    const project = data.projects.find((item) => item.id === selected);
    if (!project) throw new Error('Expected a project with images');
    await page.goto(new URL(`projects/${project.slug}/`, baseURL).href);
    await page.locator('.project-gallery').scrollIntoViewIfNeeded();
    await expect(page.locator('.project-gallery img').first()).toBeVisible();
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  } finally {
    await context.close();
  }
});
