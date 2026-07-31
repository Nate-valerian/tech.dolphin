const { test, expect } = require('@playwright/test');
const path = require('path');

function fileUrl(name) {
  return `file://${path.resolve(__dirname, name).replace(/\\/g, '/')}`;
}

test.describe('mobile nav', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('hamburger opens and closes the menu', async ({ page }) => {
    await page.goto(fileUrl('index.html'));
    const hamburger = page.locator('#nav-hamburger');
    const links = page.locator('.nav-links');

    await expect(links).not.toHaveClass(/open/);
    await hamburger.click();
    await expect(links).toHaveClass(/open/);
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    await page.locator('.nav-close-btn').click();
    await expect(links).not.toHaveClass(/open/);
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  test('Escape key closes the menu', async ({ page }) => {
    await page.goto(fileUrl('index.html'));
    const hamburger = page.locator('#nav-hamburger');
    const links = page.locator('.nav-links');

    await hamburger.click();
    await expect(links).toHaveClass(/open/);
    await page.keyboard.press('Escape');
    await expect(links).not.toHaveClass(/open/);
  });
});

test.describe('project filter tabs', () => {
  test('filtering by category hides non-matching sections', async ({ page }) => {
    await page.goto(fileUrl('projects.html'));
    const mobileSections = page.locator('[data-cat~="mobile"]');
    const mobileOnlyCount = await mobileSections.count();
    expect(mobileOnlyCount).toBeGreaterThan(0);

    const webOnlySection = page.locator('[data-cat="web"]').first();
    await expect(webOnlySection).toBeVisible();

    await page.getByRole('button', { name: /Мобильные/ }).click();
    await expect(webOnlySection).toBeHidden();
    await expect(mobileSections.first()).toBeVisible();

    await page.getByRole('button', { name: 'Все работы' }).click();
    await expect(webOnlySection).toBeVisible();
  });
});

test.describe('i18n toggle', () => {
  test('switching language updates lang attribute and visible text', async ({ page }) => {
    await page.goto(fileUrl('index.html'));
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');

    const toggle = page.locator('#lang-toggle');
    await expect(toggle).toHaveText('EN');
    await toggle.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(toggle).toHaveText('RU');
    await expect(page.locator('[data-i18n="lnav_home"]').first()).not.toHaveText('Главная');

    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(page.locator('[data-i18n="lnav_home"]').first()).toHaveText('Главная');
  });
});
