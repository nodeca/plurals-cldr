#!/usr/bin/env node

'use strict';

/* eslint-disable no-console */

const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function run() {
  await exec('npm install cldr-core@latest');
  await exec('npm run generate');
  await exec('npm test');
  console.log('Done!');
}

run();
