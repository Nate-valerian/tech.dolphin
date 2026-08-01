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

  // Some source files (several under assets/, apparently from an earlier
  // sync/download tool) carry the Windows Hidden attribute. Compress-Archive
  // respects -Force for files passed to it directly, but not for hidden
  // files it discovers itself while recursing into a piped-in folder — so
  // anything hidden and nested more than one level deep silently vanishes
  // from the zip even though it's sitting right there in dist/. dist/ is a
  // throwaway build output, so just strip the attribute here rather than
  // fighting Compress-Archive's recursion behavior.
  execFileSync('powershell.exe', [
    '-NoProfile', '-Command',
    `Get-ChildItem -Path '${DIST}' -Recurse -Force | ForEach-Object { $_.Attributes = $_.Attributes -band (-bnot [System.IO.FileAttributes]::Hidden) }`
  ]);
}

function listFilesRecursive(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full, base));
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
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
  // Get-ChildItem -Force (not a bare '*' glob) so top-level files with the
  // Hidden attribute still get zipped. build() already stripped Hidden
  // recursively, so this is now just belt-and-suspenders for the top level.
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

  // Check every file actually in dist/, not just REQUIRED_FILES — that
  // narrower list is exactly what let assets/* silently go missing before,
  // since no asset path was ever in it.
  const expected = listFilesRecursive(DIST);
  const missing = expected.filter(f => !listing.includes(f.replace(/\//g, '\\')) && !listing.includes(f));
  if (missing.length) {
    throw new Error(`Zip is missing files that dist/ has:\n  ${missing.join('\n  ')}`);
  }
}

build();
verify();
const zipPath = zip();
verifyZip(zipPath);
console.log(`Deploy bundle verified and zipped: ${zipPath}`);
