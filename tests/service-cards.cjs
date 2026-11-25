const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('.welcome-popup__close').click();
    await page.locator('[data-welcome-popup]').waitFor({ state: 'hidden' });

    const cards = page.locator('.service-card');
    assert.equal(await cards.count(), 7);
    assert.deepEqual(await cards.locator('h3').allTextContents(), [
      'Manicure', 'Pedicure', 'BIAB', 'Builder Gel', 'Rubber Base', 'Gel X', 'Japanese Head Spa'
    ]);
    assert.equal(await page.locator('.price-grid > div').count(), 38);

    for (const [width, firstRowCount] of [[1440, 4], [900, 2], [390, 1]]) {
      await page.setViewportSize({ width, height: 1000 });
      await cards.first().scrollIntoViewIfNeeded();
      const layout = await cards.evaluateAll(elements => elements.map(element => {
        const { top, left, right } = element.getBoundingClientRect();
        return { top, left, right, overflow: element.scrollWidth > element.clientWidth + 1 };
      }));
      assert.equal(layout.filter(card => Math.abs(card.top - layout[0].top) < 1).length, firstRowCount);
      assert.ok(layout.every(card => card.left >= 0 && card.right <= width && !card.overflow));
      assert.ok(await cards.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));

      for (const link of await page.locator('[data-service-price]').all()) {
        const category = await link.getAttribute('data-service-price');
        assert.ok(await link.getAttribute('aria-label'));
        await link.click();
        assert.equal(await page.locator(`[data-price-panel="${category}"]`).isVisible(), true);
        assert.equal(await page.locator('[data-price-panel]:visible').count(), 1);
      }
    }

    const manicure = page.locator('[data-service-price="manicure"]');
    await manicure.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-price-tab="manicure"]').getAttribute('aria-selected'), 'true');
    assert.deepEqual(errors, []);
    console.log('PASS: 7 service cards, 38 price rows, desktop/tablet/mobile layouts, images, price links and keyboard activation.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
