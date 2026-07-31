#!/usr/bin/env node
/*
 * Builds dist/ as an exact copy of everything the live site needs, then
 * zips it for upload. Copies the whole repo minus a small exclude list
 * (rather than an include whitelist) so a new file never has to be
 * remembered separately here — the failure mode that once shipped a
 * deploy zip missing js/main.js and js/analytics.js.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const EXCLUDE = new Set([
  'node_modules', '.git', '.netlify', 'dist', 'scripts',
  'test-results', 'playwright-report',
  'netlify-abroad',
  'package.json', 'package-lock.json',
  'email-form-smoke.spec.js', 'ANALYTICS.md', '.gitignore',
]);

const REQUIRED_FILES = [
  'index.html', 'projects.html', 'contact.html', 'faq.html', 'pricing.html',
  'robots.txt', 'sitemap.xml', 'site.webmanifest',
  'yandex_3d97a29ea20ba61d.html',
  'css/style.css',
  'js/analytics.js', 'js/i18n.js', 'js/main.js',
];

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function build() {
  rmrf(DIST);
  fs.mkdirSync(DIST, { recursive: true });

  for (const entry of fs.readdirSync(ROOT)) {
    if (EXCLUDE.has(entry) || entry.endsWith('.zip')) continue;
    fs.cpSync(path.join(ROOT, entry), path.join(DIST, entry), { recursive: true });
  }
}

function verify() {
  const missing = REQUIRED_FILES.filter(f => !fs.existsSync(path.join(DIST, f)));
  if (missing.length) {
    throw new Error(`Deploy bundle is missing required files:\n  ${missing.join('\n  ')}`);
  }
}

function zip() {
  const zipName = `spaceweb-upload-tech-dolphin-${new Date().toISOString().slice(0, 10)}.zip`;
  const zipPath = path.join(ROOT, zipName);
  rmrf(zipPath);
  // Get-ChildItem -Force (not a bare '*' glob) so files with the Hidden
  // attribute — e.g. robots.txt, site.webmanifest on this machine — still
  // get zipped. A plain `Compress-Archive -Path 'dist\*'` silently drops them.
  execFileSync('powershell.exe', [
    '-NoProfile', '-Command',
    `Get-ChildItem -Path '${DIST}' -Force | Compress-Archive -DestinationPath '${zipPath}' -Force`
  ]);
  return zipPath;
}

function verifyZip(zipPath) {
  const listing = execFileSync('powershell.exe', [
    '-NoProfile', '-Command',
    `Add-Type -A System.IO.Compression.FileSystem; ` +
    `[System.IO.Compression.ZipFile]::OpenRead('${zipPath}').Entries.FullName`
  ]).toString();
  const missing = REQUIRED_FILES.filter(f => !listing.includes(f.replace(/\//g, '\\')) && !listing.includes(f));
  if (missing.length) {
    throw new Error(`Zip is missing required files even though dist/ had them:\n  ${missing.join('\n  ')}`);
  }
}

build();
verify();
const zipPath = zip();
verifyZip(zipPath);
console.log(`Deploy bundle verified and zipped: ${zipPath}`);
