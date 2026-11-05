const {test, expect, open} = require('./helpers');
const fs = require('fs');
const path = require('path');

test('international project media uses English previews on both portfolio pages', async ({page}) => {
  for (const name of ['index.html', 'projects.html']) {
    await open(page, 'netlify-abroad', name);
    const sources = await page.locator('img,video,source').evaluateAll(elements => elements.flatMap(element =>
      ['src', 'data-src', 'poster'].map(attribute => element.getAttribute(attribute)).filter(Boolean)));
    for (const russian of ['dom-sessions.jpg', 'dom-login.jpg', 'dom-journey.jpg', 'dom_video.mp4', 'domspace.mp4']) {
      expect(sources.some(source => source.includes(russian)), name + ' still embeds ' + russian).toBe(false);
    }
    for (const screen of ['sessions', 'login', 'journey']) {
      const image = page.locator('img[src="assets/dom-' + screen + '-en.webp"]').last();
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(image).toHaveCSS('object-fit', 'contain');
    }
    const englishText = await page.locator(name === 'index.html' ? '#projects' : 'main').innerText();
    expect(englishText).not.toMatch(/[\u0400-\u04ff]/);
    await expect(page.locator('source[data-src="assets/dom-short-01.mp4"]')).not.toHaveCount(0);
  }
});

test('international visitors default to English even with a Russian geo-IP response', async ({page}) => {
  let geoRequests = 0;
  await page.route(/ipapi\.co|geojs\.io/, route => {geoRequests++;return route.fulfill({body: 'RU'});});
  await page.addInitScript(() => sessionStorage.setItem('td_geo_lang_international', 'ru'));
  await open(page, 'netlify-abroad', 'projects.html');
  await page.evaluate(() => initGeoLanguage());
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(geoRequests).toBe(0);
  await page.locator('#lang-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
});

test('Russian portfolio keeps the original screenshots and screen recordings', () => {
  for (const name of ['index.html', 'projects.html']) {
    const html = fs.readFileSync(path.resolve(__dirname, '..', name), 'utf8');
    expect(html).toContain('assets/dom_video.mp4');
    expect(html).toContain('assets/dom-sessions.jpg');
    expect(html).not.toContain('localized-project-preview');
  }
});
