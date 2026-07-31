#!/usr/bin/env node
/*
 * Guards against unnoticed divergence between the two copies of the site:
 * techdolphin.ru at the repo root, and netlify-abroad/ (English, USD,
 * Datvida LLC). The two share no build step -- every fix has to be
 * hand-ported to both -- which is exactly how the mobile-nav z-index bug,
 * the honeypot gap, and the light-theme pricing regression each missed one
 * side for a whole audit cycle before being caught.
 *
 * This stores a snapshot of `git diff --no-index` between each forked pair.
 * If the current diff no longer matches the snapshot, one side changed in a
 * way the baseline doesn't account for -- fail so it gets a deliberate look
 * instead of shipping unreviewed. Run with --update after confirming a
 * change is intentional (or already ported to both sides).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BASELINE_DIR = path.join(__dirname, 'drift-baseline');

const PAIRS = [
  ['js/main.js', 'netlify-abroad/js/main.js'],
  ['js/i18n.js', 'netlify-abroad/js/i18n.js'],
  ['js/analytics.js', 'netlify-abroad/js/analytics.js'],
  ['css/style.css', 'netlify-abroad/css/style.css'],
];

function diffOf(a, b) {
  try {
    return execFileSync('git', ['diff', '--no-index', '--no-color', a, b], {
      cwd: ROOT,
      encoding: 'utf8',
    });
  } catch (error) {
    // `git diff --no-index` exits 1 when the files differ -- expected here,
    // the diff text is still on stdout.
    if (typeof error.stdout === 'string') return error.stdout;
    throw error;
  }
}

function baselinePath(a) {
  return path.join(BASELINE_DIR, a.replace(/[\\/]/g, '__') + '.diff');
}

function main() {
  const update = process.argv.includes('--update');
  if (update) fs.mkdirSync(BASELINE_DIR, { recursive: true });

  let failed = false;
  for (const [a, b] of PAIRS) {
    const current = diffOf(a, b);
    const file = baselinePath(a);

    if (update) {
      fs.writeFileSync(file, current);
      console.log(`Updated drift baseline for ${a} <-> ${b}`);
      continue;
    }

    if (!fs.existsSync(file)) {
      console.error(`No drift baseline for ${a} <-> ${b}.`);
      console.error(`Review the current diff, then run: npm run check-drift -- --update`);
      failed = true;
      continue;
    }

    const baseline = fs.readFileSync(file, 'utf8');
    if (baseline !== current) {
      console.error(`\nDrift detected between ${a} and ${b}.`);
      console.error(`One side changed relative to the other in a way the stored baseline doesn't expect.`);
      console.error(`If the change was intentional (or has already been ported to both sides), run:`);
      console.error(`  npm run check-drift -- --update\n`);
      failed = true;
    }
  }

  if (failed && !update) {
    console.error('Drift check failed. See above.');
    process.exit(1);
  } else if (!update) {
    console.log('No unexpected drift between techdolphin.ru and netlify-abroad.');
  }
}

main();
