import { expect, test } from '@playwright/test';
import type { CareerDataset } from '../../scripts/lib/model';
import { contactLinks, emailHref, formatPhone, hasContact } from '../../scripts/lib/contact';

for (const javaScriptEnabled of [true, false]) {
  test(`contact channels are reachable without a form, JavaScript ${javaScriptEnabled ? 'on' : 'off'}`, async ({ browser, baseURL }, testInfo) => {
    // Two locales across eleven viewport sizes, with and without JavaScript.
    test.setTimeout(90_000);
    if (!baseURL) throw new Error('Expected a base URL');
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      const data: CareerDataset = await (await context.request.get(new URL('data/career.json', baseURL).href)).json();
      const contact = data.resume?.contact;
      const available = hasContact(contact, data.profile.links);
      const errors: string[] = [];
      page.on('pageerror', error => {
        // Chromium reports a native cancellation when fast MPA navigation skips
        // a view transition, including with page JavaScript disabled.
        if (error.name === 'AbortError' && error.message === 'Transition was skipped') return;
        errors.push(error.message);
      });
      for (const language of ['', 'pt-br/']) {
        const home = new URL(language, baseURL);
        await page.goto(home.href);
        const section = page.locator('#contact');
        await expect(section).toHaveCount(available ? 1 : 0);
        if (!available) continue;
        await page.locator('.hero__cta--ghost').focus();
        await page.locator('.hero__cta--ghost').press('Enter');
        await expect(page).toHaveURL(`${home.href}#contact`);
        await expect(section.getByRole('heading', { level: 2 })).toBeVisible();
        await expect(section.locator('form, input, iframe')).toHaveCount(0);
        await expect(section.locator('a[href^="mailto:"]')).toHaveCount(contact?.email ? 1 : 0);
        if (contact?.email) {
          await expect(section.locator('a[href^="mailto:"]')).toHaveAttribute('href', emailHref(contact.email));
          await expect(section.locator('a[href^="mailto:"]')).toContainText(contact.email);
        }
        await expect(section.locator('a[href^="tel:"]')).toHaveCount(contact?.phone ? 1 : 0);
        if (contact?.phone) {
          await expect(section.locator('a[href^="tel:"]')).toHaveAttribute('href', `tel:${contact.phone}`);
          await expect(section.locator('a[href^="tel:"]')).toContainText(formatPhone(contact.phone));
        }
        await expect(section.getByRole('link', { name: 'WhatsApp' })).toHaveCount(contact?.whatsapp ? 1 : 0);
        if (contact?.whatsapp && contact.phone) {
          await expect(section.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', `https://wa.me/${contact.phone.slice(1)}`);
        }
        for (const link of contactLinks(contact, data.profile.links)) {
          const element = section.getByRole('link', { name: link.label, exact: true });
          await expect(element).toHaveAttribute('href', link.href);
          await element.focus();
          await expect(element).toBeFocused();
        }
        for (const width of [320, 390, 700, 768, 1024, 1280, 1440, 1652, 1920, 2560, 3440]) {
          await page.setViewportSize({ width, height: 900 });
          await section.scrollIntoViewIfNeeded();
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          for (const link of await section.getByRole('link').all()) {
            const box = await link.boundingBox();
            expect(box && box.x >= 0 && box.x + box.width <= width + 1).toBeTruthy();
          }
          if (contact?.email) {
            const email = section.locator('.contact-channel--email strong');
            const layout = await email.evaluate(element => {
              const range = document.createRange();
              range.selectNodeContents(element);
              const bounds = element.getBoundingClientRect();
              const rects = [...range.getClientRects()].filter(rect => rect.width > 0);
              return {
                lines: new Set(rects.map(rect => Math.round(rect.top))).size,
                contained: rects.every(rect => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1)
              };
            });
            expect(layout.contained, `email text must fit at ${width}px`).toBe(true);
            if (width >= 1024) expect(layout.lines, `email must stay on one line at ${width}px`).toBe(1);
            else expect(layout.lines, `email should wrap at most once at ${width}px`).toBeLessThanOrEqual(2);
          }
          if ([390, 1440, 1920, 3440].includes(width)) {
            await page.screenshot({ path: testInfo.outputPath(`contact-${language ? 'pt' : 'en'}-${width}.png`) });
          }
        }
        await page.goto(new URL('about/', home).href);
        const footerLink = page.locator('.site-footer').getByRole('link', { name: language ? 'Contato' : 'Contact', exact: true });
        await footerLink.focus();
        await footerLink.press('Enter');
        await expect(page).toHaveURL(`${home.href}#contact`);
      }
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}
