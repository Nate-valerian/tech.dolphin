const {test: base, expect} = require('./helpers');
const fs = require('fs');
const path = require('path');
const http = require('http');
const {dictionaryFor} = require('../scripts/build');
const international = require('../config/regions.json').find(site => site.id === 'international');
const dictionary = dictionaryFor(international);
const directory = path.resolve(__dirname, '..', international.directory);
const pages = ['projects', 'pricing', 'faq', 'contact'];

// Serve the actual generated files at the same extensionless aliases as Netlify.
// Redirect mode also exercises the generated _redirects contract locally.
const test = base.extend({internationalPreview: async ({page}, use) => {
  const rules = fs.readFileSync(path.join(directory, '_redirects'), 'utf8')
    .split('\n').filter(line => line.trim() && !line.startsWith('#')).map(line => line.trim().split(/\s+/));
  let redirects = false;
  const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4'};
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const normalized = url.pathname.replace(/\/+$/, '') || '/';
    const rule = redirects && rules.find(([from]) => from === normalized);
    if (rule) {
      response.writeHead(Number(rule[2].replace('!', '')), {location: rule[1] + url.search});
      return response.end();
    }
    let relative = url.pathname === '/' ? 'index.html' : '.' + url.pathname;
    if (pages.some(name => url.pathname === '/' + name)) relative += '.html';
    const file = path.resolve(directory, relative);
    if (!file.startsWith(directory + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404);
      return response.end('Missing local preview file');
    }
    response.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream'});
    response.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({contentType: 'text/css', body: ''}));
  try {
    await use({origin: 'http://127.0.0.1:' + server.address().port, enableRedirects: () => {redirects = true;}});
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}});

test('international clean URLs retain their page metadata in both languages', async ({page, internationalPreview}) => {
  const {origin} = internationalPreview;
  for (const name of pages) {
    await page.goto(origin + '/' + name);
    for (const language of ['en', 'ru']) {
      await page.evaluate(language => applyLang(language), language);
      await expect(page).toHaveTitle(dictionary[language]['meta_' + name + '_title']);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', dictionary[language]['meta_' + name + '_desc']);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', dictionary[language]['meta_' + name + '_title']);
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', dictionary[language]['meta_' + name + '_title']);
    }
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', international.domain + '/' + name + '.html');
  }
});

test('international clean and trailing-slash aliases reach the complete canonical page', async ({page, internationalPreview}) => {
  const {origin, enableRedirects} = internationalPreview;
  enableRedirects();
  const missing = [];
  const errors = [];
  page.on('response', response => {if (response.url().startsWith(origin) && response.status() >= 400) missing.push(response.url());});
  page.on('pageerror', error => errors.push(error.message));
  for (const name of ['index', ...pages]) {
    for (const ending of ['', '/']) {
      await page.goto(origin + '/' + name + ending + '?source=routing-test');
      await expect(page).toHaveURL(origin + (name === 'index' ? '/' : '/' + name + '.html') + '?source=routing-test');
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.locator('link[rel="stylesheet"][href*="css/style.css"]').evaluate(link => link.sheet?.cssRules.length)).toBeGreaterThan(0);
      await expect(page).toHaveTitle(dictionary.en['meta_' + (name === 'index' ? 'home' : name) + '_title']);
    }
  }
  expect(missing).toEqual([]);
  expect(errors).toEqual([]);
});
