const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');
const {prepareSite} = require('../scripts/prepare-deploy');
const ROOT = path.resolve(__dirname, '..');
const files = (directory, base = directory) => fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? files(full, base) : [path.relative(base, full)];
}).sort();

test('Netlify stages only the international public files without shell dependencies', () => {
  const destination = path.join(ROOT, 'dist-international');
  fs.mkdirSync(destination, {recursive: true});
  fs.writeFileSync(path.join(destination, 'internal-not-public.txt'), 'stale build input');
  // A Linux Netlify build has no PowerShell. Make it unavailable here too.
  execFileSync(process.execPath, ['scripts/prepare-deploy.js', '--site', 'international'], {
    cwd: ROOT, env: {...process.env, PATH: path.dirname(process.execPath)}
  });
  const source = path.join(ROOT, 'netlify-abroad');
  const expected = files(source);
  expect(files(destination)).toEqual(expected);
  for (const file of expected) {
    expect(fs.readFileSync(path.join(destination, file)).equals(fs.readFileSync(path.join(source, file))), file).toBe(true);
  }
  expect(expected).not.toContain('CHANGELOG.md');
  expect(expected).not.toContain('yandex_3d97a29ea20ba61d.html');
  expect(() => prepareSite('unknown')).toThrow(/Unknown site/);
});
