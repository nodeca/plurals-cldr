'use strict';

/*global describe, it*/

var assert = require('assert');
var format = require('util').format;

var _ = require('lodash');
var p = require('../');

var tests = require('./test_data.json');

describe('cardinals', function () {
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

describe('ordinals', function () {
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
