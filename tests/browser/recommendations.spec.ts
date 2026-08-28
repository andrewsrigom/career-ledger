import { expect, test } from '@playwright/test';
import type { CareerDataset } from '../../scripts/lib/model';

test('recommendations preserve quotes, identity and local portraits across languages', async ({ page }, testInfo) => {
  const data: CareerDataset = await (await page.request.get('./data/career.json')).json();
  const originals = data.resume?.recommendations ?? [];
  const errors: string[] = [];
  const remoteResources: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).hostname !== '127.0.0.1') remoteResources.push(request.url());
  });
  for (const language of ['', 'pt-br/']) {
    const localized: CareerDataset = await (await page.request.get(`./${language}data/career.json`)).json();
    await page.goto(`./${language}#recommendations`);
    const section = page.locator('#recommendations');
    if (!originals.length) {
      expect(data.reviewPortraits).toBeUndefined();
      await expect(section).toHaveCount(0);
      continue;
    }
    await expect(section.locator('blockquote')).toHaveCount(originals.length);
    await expect(section.locator('time, iframe, button')).toHaveCount(0);
    const translated = localized.resume!.recommendations!;
    for (const [index, item] of originals.entries()) {
      const row = section.locator('[data-recommendation]').nth(index);
      const quote = row.locator('blockquote');
      await expect(quote).toHaveText(translated[index]!.quote);
      await expect(quote).toHaveAttribute('cite', item.sourceUrl);
      await expect(quote).toHaveAttribute('lang', translated[index]!.translated ? 'pt-BR' : 'en');
      const name = row.locator('.recommendation__name');
      await name.focus();
      await expect(name).toBeFocused();
      await expect(name).toContainText(item.name);
      await expect(name).toHaveAttribute('href', item.profileUrl);
      // Keyboard focus must complete any reveal instead of leaving the quote hidden.
      await expect(row).toHaveCSS('opacity', '1');
      const portrait = (data.preview ? data.reviewPortraits?.[item.id] : undefined) ?? item.portrait;
      const image = row.locator('img');
      await expect(image).toHaveCount(portrait ? 1 : 0);
      if (portrait) {
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveAttribute('alt', '');
        await expect(image).toHaveAttribute('width', String(portrait.width));
        await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(portrait.width);
      }
    }
    await section.getByRole('link').last().focus();
    await expect(section.getByRole('link').last()).toBeFocused();
    if (translated.some(item => item.translated)) await expect(section).toContainText('Traduções do inglês');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#recommendations-heading').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`recommendations-${language ? 'pt' : 'en'}-desktop.png`) });
  }
  expect(errors).toEqual([]);
  expect(remoteResources).toEqual([]);
});

for (const javaScriptEnabled of [false, true]) {
  test(`recommendations stay readable on mobile with JavaScript ${javaScriptEnabled ? 'on and reduced motion' : 'off'}`, async ({ browser, baseURL }, testInfo) => {
    if (!baseURL) throw new Error('Expected a base URL');
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
    try {
      const page = await context.newPage();
      const data: CareerDataset = await (await context.request.get(new URL('data/career.json', baseURL).href)).json();
      for (const language of ['', 'pt-br/']) {
        await page.goto(new URL(`${language}#recommendations`, baseURL).href);
        const rows = page.locator('[data-recommendation]');
        await expect(rows).toHaveCount(data.resume?.recommendations?.length ?? 0);
        for (const width of [390, 320]) {
          await page.setViewportSize({ width, height: 844 });
          for (const row of await rows.all()) {
            await row.scrollIntoViewIfNeeded();
            await expect(row).toBeVisible();
            await expect(row).toHaveCSS('opacity', '1');
            const box = await row.boundingBox();
            expect(box && box.x >= 0 && box.x + box.width <= width + 1).toBeTruthy();
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
        if (await rows.count()) {
          await page.setViewportSize({ width: 390, height: 844 });
          await page.locator('#recommendations-heading').scrollIntoViewIfNeeded();
          await page.screenshot({ path: testInfo.outputPath(`recommendations-${language ? 'pt' : 'en'}-mobile.png`) });
        }
      }
    } finally { await context.close(); }
  });
}
