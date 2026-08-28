import { expect, test } from '@playwright/test';
import type { CareerDataset } from '../../scripts/lib/model';
import { contactLinks, emailHref, formatPhone, hasContact } from '../../scripts/lib/contact';

for (const javaScriptEnabled of [true, false]) {
  test(`contact channels are reachable without a form, JavaScript ${javaScriptEnabled ? 'on' : 'off'}`, async ({ browser, baseURL }, testInfo) => {
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
        for (const width of [1440, 390, 320]) {
          await page.setViewportSize({ width, height: 900 });
          await section.scrollIntoViewIfNeeded();
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          for (const link of await section.getByRole('link').all()) {
            const box = await link.boundingBox();
            expect(box && box.x >= 0 && box.x + box.width <= width + 1).toBeTruthy();
          }
          await page.screenshot({ path: testInfo.outputPath(`contact-${language ? 'pt' : 'en'}-${width}.png`) });
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
