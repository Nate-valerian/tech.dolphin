#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SITES = require('../config/regions.json');
const INCLUDE = ['index.html','projects.html','pricing.html','faq.html','contact.html','robots.txt','sitemap.xml','site.webmanifest','yandex_3d97a29ea20ba61d.html','assets','css','js'];
const REQUIRED_FILES = ['index.html','projects.html','pricing.html','faq.html','contact.html','robots.txt','sitemap.xml','site.webmanifest','yandex_3d97a29ea20ba61d.html','css/style.css','js/main.js','js/i18n.js','js/analytics.js','js/storage.js','js/region.js'];
const OUTPUT_DIRS = new Map(SITES.map(site => [site.id, path.join(ROOT, site.id === 'ru' ? 'dist' : 'dist-international')]));

function prepareSite(id = 'international') {
  const site = SITES.find(candidate => candidate.id === id);
  if (!site) throw new Error('Unknown site ' + id);
  const sourceRoot = path.resolve(ROOT, site.directory);
  const destination = OUTPUT_DIRS.get(id);
  // Only these two known output directories may be replaced.
  if (!['dist', 'dist-international'].some(name => destination === path.join(ROOT, name))) {
    throw new Error('Refusing to remove an unexpected generated path: ' + destination);
  }
  const inputs = INCLUDE.filter(entry => site.id === 'ru' || !entry.startsWith('yandex_'));
  for (const entry of inputs) {
    if (!fs.existsSync(path.join(sourceRoot, entry))) throw new Error('Missing deploy input: ' + entry);
  }
  fs.rmSync(destination, {recursive: true, force: true});
  fs.mkdirSync(destination, {recursive: true});
  for (const entry of inputs) {
    fs.cpSync(path.join(sourceRoot, entry), path.join(destination, entry), {recursive: true});
  }
  for (const required of REQUIRED_FILES.filter(file => site.id === 'ru' || !file.startsWith('yandex_'))) {
    if (!fs.existsSync(path.join(destination, required))) throw new Error('Missing deploy file: ' + required);
  }
  console.log('Prepared ' + site.id + ' public files: ' + path.relative(ROOT, destination));
  return destination;
}

if (require.main === module) {
  require('./build').build();
  require('./check-site').check();
  const index = process.argv.indexOf('--site');
  prepareSite(index >= 0 ? process.argv[index + 1] : 'international');
}
module.exports = {prepareSite, INCLUDE};
