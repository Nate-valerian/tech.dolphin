const { test, expect } = require('@playwright/test');
const path = require('path');

test('contact form submits through EmailJS SDK', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js', route => {
    route.fulfill({
      contentType: 'application/javascript',
      body: `
        window.__emailjsSends = [];
        window.emailjs = {
          init(options) { window.__emailjsInit = options; },
          send(service, template, params, options) {
            window.__emailjsSends.push({ service, template, params, options });
            return Promise.resolve({ status: 200, text: 'OK' });
          }
        };
      `
    });
  });

  const fileUrl = `file://${path.resolve(__dirname, 'index.html').replace(/\\\\/g, '/')}`;
  await page.goto(fileUrl);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.fill('#ct-name', 'Smoke Test');
  await page.fill('#ct-phone', '+10000000000');
  await page.fill('#ct-email', 'smoke@example.com');
  await page.fill('#ct-message', 'Smoke test message');
  await page.click('#ct-form button[type="submit"]');

  await expect(page.locator('#ct-success')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__emailjsSends.length)).toBe(2);
});
