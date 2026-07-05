#!/usr/bin/env node
'use strict';
// test/run.js — the single entry point for the regression suite.
//
//   node test/run.js
//
// Discovers every test/cases/*.test.js file, runs each in its own fresh,
// isolated game environment (see harness.js), and reports pass/fail. Exits
// with a non-zero status if anything failed, so it's CI-friendly.

const fs   = require('fs');
const path = require('path');

const CASES_DIR = path.join(__dirname, 'cases');

async function main() {
  const files = fs.readdirSync(CASES_DIR)
    .filter(f => f.endsWith('.test.js'))
    .sort();

  if (files.length === 0) {
    console.error('No test files found in test/cases/');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const file of files) {
    const mod = require(path.join(CASES_DIR, file));
    const name = mod.name || file;
    const start = Date.now();
    try {
      await mod.run();
      const ms = Date.now() - start;
      console.log(`  \x1b[32m✓\x1b[0m ${name}  (${ms}ms)`);
      passed++;
    } catch (err) {
      const ms = Date.now() - start;
      console.log(`  \x1b[31m✗\x1b[0m ${name}  (${ms}ms)`);
      console.log(`      ${(err && err.stack) || err}`.split('\n').join('\n      '));
      failed++;
      failures.push({ file, name, err });
    }
  }

  console.log('');
  console.log(`${passed + failed} tests, ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\nFailed:');
    for (const f of failures) console.log(`  - ${f.name} (${f.file})`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('test runner crashed:', err);
  process.exit(1);
});
