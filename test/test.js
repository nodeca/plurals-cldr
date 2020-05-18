'use strict';

/* eslint-env mocha,es6 */

const assert = require('assert');

const p = require('../');

const tests = require('./test_data.json');

/* eslint-disable max-nested-callbacks */

// Autogenerate tests for cardinal forms from parsed fixtures
describe('cardinals', function () {

  // Add values to cover missed branches
  tests.cardinal.lv.zero.push('3.14');
  tests.cardinal.lv.one.push('3.21');

  // Walk on fixtures
  Object.entries(tests.cardinal).forEach(([ loc, forms ]) => {
    describe(loc, function () {
      Object.entries(forms).forEach(([ form, samples ]) => {
        it(form, function () {
          samples.forEach(sample => {
            let result, f_idx;

            result = p(loc, sample);
            assert.equal(result, form,
              `FORM FAILED: input = ${sample}, returned [${result}] instead of [${form}]`);

            result = p.indexOf(loc, sample);
            f_idx  = p.forms(loc).indexOf(form);
            assert.equal(result, f_idx,
              `INDEX FAILED: input = ${sample}, returned [${result}] instead of [${f_idx}]`);
          });
        });
      });
    });
  });
});


// Autogenerate tests for ordinal forms from parsed fixtures
describe('ordinals', function () {

  // Add dummy value to trigger unused (and uncovered) brances
  tests.ordinal.en.other.push('3.1415');

  // Walk on fixtures
  Object.entries(tests.ordinal).forEach(([ loc, forms ]) => {
    describe(loc, function () {
      Object.entries(forms).forEach(([ form, samples ]) => {
        it(form, function () {
          samples.forEach(sample => {
            let result, f_idx;

            result = p.ordinal(loc, sample);
            assert.equal(result, form,
              `FORM FAILED: input = ${sample}, returned [${result}] instead of [${form}]`);

            result = p.ordinal.indexOf(loc, sample);
            f_idx  = p.ordinal.forms(loc).indexOf(form);
            assert.equal(result, f_idx,
              `INDEX FAILED: input = ${sample}, returned [${result}] instead of [${f_idx}]`);
          });
        });
      });
    });
  });
});


describe('api', function () {
  it('should return error value on invalid locales', function () {
    assert.strictEqual(p('bad_locale', 2), null);
    assert.strictEqual(p.ordinal('bad_locale', 2), null);
    assert.strictEqual(p.forms('bad_locale'), null);
    assert.strictEqual(p.ordinal.forms('bad_locale'), null);
    assert.strictEqual(p.indexOf('bad_locale', 2), -1);
    assert.strictEqual(p.ordinal.indexOf('bad_locale', 2), -1);
  });

  it('should normalize locales', function () {
    assert.deepEqual(p.forms('pt-PT'), [ 'one', 'other' ]);
    assert.deepEqual(p.forms('pt-PPPP'), [ 'one', 'other' ]);
    assert.deepEqual(p.forms('pt_PPPP'), [ 'one', 'other' ]);
  });
});
