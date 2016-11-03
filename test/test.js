'use strict';

/*global describe, it*/

var assert = require('assert');
var format = require('util').format;

var _ = require('lodash');
var p = require('../');

var tests = require('./test_data.json');

/* eslint-disable max-nested-callbacks */

// Autogenerate tests for cardinal forms from parsed fixtures
describe('cardinals', function () {

  // Add values to cover missed branches
  tests.cardinal.lv.zero.push('3.14');
  tests.cardinal.lv.one.push('3.21');

  // Walk on fixtures
  _.forEach(tests.cardinal, function (forms, loc) {
    describe(loc, function () {
      _.forEach(forms, function (samples, form) {
        it(form, function () {
          _.forEach(samples, function (sample) {
            var result, f_idx;

            result = p(loc, sample);
            assert.equal(result, form,
              format('FORM FAILED: input = %s, returned [%s] instead of [%s]', sample, result, form));

            result = p.indexOf(loc, sample);
            f_idx  = p.forms(loc).indexOf(form);
            assert.equal(result, f_idx,
              format('INDEX FAILED: input = %s, returned [%s] instead of [%s]', sample, result, f_idx));
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
  _.forEach(tests.ordinal, function (forms, loc) {
    describe(loc, function () {
      _.forEach(forms, function (samples, form) {
        it(form, function () {
          _.forEach(samples, function (sample) {
            var result, f_idx;

            result = p.ordinal(loc, sample);
            assert.equal(result, form,
              format('FORM FAILED: input = %s, returned [%s] instead of [%s]', sample, result, form));

            result = p.ordinal.indexOf(loc, sample);
            f_idx  = p.ordinal.forms(loc).indexOf(form);
            assert.equal(result, f_idx,
              format('INDEX FAILED: input = %s, returned [%s] instead of [%s]', sample, result, f_idx));
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
