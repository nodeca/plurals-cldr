#!/usr/bin/env node

'use strict';

/* eslint-disable no-console */

const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function run() {
  let res = await exec('npm view cldr-core versions --json');

  let versions = JSON.parse(res.stdout);
  let latest = '';

  while (versions.length) {
    let v = versions.pop();

    // Ignore betas
    if (/^\d+[.]\d+[.]\d+$/.test(v)) {
      latest = v;
      break;
    }
  }

  if (!latest) {
    console.log('Could not detect latest CLDR version');
    return;
  }

  res = await exec('npm list cldr-core --json');
  const current = JSON.parse(res.stdout).dependencies['cldr-core'].version;

  if (current === latest) {
    console.log(`CLDR version is up to date (${latest}), no update required`);
    return;
  }

  console.error(`New CLDR version available (${latest}), update required`);
  require('process').exitCode = 1;
}

run();
