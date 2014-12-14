#!/usr/bin/env node

'use strict';

var fs     = require('fs');
var format = require('util').format;
var path   = require('path');

var _    = require('lodash');
var cldr = require('cldr-data');

var cardinals = cldr('supplemental/plurals');
var ordinals  = cldr('supplemental/ordinals');

var version   = cardinals.supplemental.version;

var FORMS = [ 'zero', 'one', 'two', 'few', 'many', 'other' ];

////////////////////////////////////////////////////////////////////////////////
// Helpers

// Strip key prefixes to get clear names: zero / one / two / few / many / other
//
function renameKeys(rules) {
  var result = {};
  Object.keys(rules).forEach(function (k) {
    result[k.match(/[^-]+$/)] = rules[k];
  });
  return result;
}

// Create array of sample values for single range
// 5~16, 0.04~0.09. Both string & integer forms (when possible)
function fillRange(val) {
  var start = val.split('~')[0];
  var end   = val.split('~')[1];

  var decimals = (start.split('.')[1] || '').length;
  var mult = Math.pow(10, decimals);

  var range = _.range(start * mult, end * mult + 1)
                  // round errors to required decimal precision
                  .map(function (val) {
                    return (val / mult).toFixed(decimals);
                  });

  var last = range[range.length - 1];

  // Stupid self check
  if (+end !== +last) {
    throw new Error(format('Range create error for %s: last value is %s', val, last));
  }

  // Now we have array of string samples. Add integers when possible.
  var result = [];

  range.forEach(function (val) {
    // push test data as String
    result.push(val);
    // push test data as Number if the same
    if (String(+val) === val) { result.push(+val); }
  });

  return result;
}

// Create array of test values for @integer or @decimal
function createSamples(src) {
  var result = [];
  src
      .replace(/…/, '')
      .trim()
      .replace(/,$/, '')
      .split(',')
      .map(function (val) { return val.trim(); })
      .forEach(function (val) {
    if (val.indexOf('~') !== -1) {
      result = result.concat(fillRange(val));
    } else {
      // push test data as String
      result.push(val);
      // push test data as Number if the same
      if (String(+val) === val) { result.push(+val); }
    }
  });
  return result;
}

// Create equation for single form rule
function toSingleRule(str) {

  return str
    // replace modulus with shortcuts
    .replace(/([nivwft]) % (\d+)/g, '$1$2')
    // replace ranges
    .replace(/([nivwft]\d*) (=|\!=) (\d+[.,][.,\d]+)/g, function (match, v, cond, range) {
      // range = 5,8,9 (simple set)
      if (range.indexOf('..') < 0 && range.indexOf(',') >= 0) {
        if (cond === '=') {
          return format('IN([ %s ], %s)', range.split(',').join(', '), v);
        }
        return format('!IN([ %s ], %s)', range.split(',').join(', '), v);
      }
      // range = 0..5 or 0..5,8..20 or 0..5,8
      var conditions = range.split(',').map(function (interval) {
        // simple value
        if (interval.indexOf('..') < 0) {
          return format('%s %s %s', v, cond, interval);
        }
        // range
        var start = interval.split('..')[0],
            end   = interval.split('..')[1];
        if (cond === '=') {
          return format('B(%s, %s, %s)', start, end, v);
        }
        return format('!B(%s, %s, %s)', start, end, v);
      });

      var joined;
      if (conditions.length > 1) {
        joined =  '(' + conditions.join(cond === '=' ? ' || ' : ' && ') + ')';
      } else {
        joined = conditions[0];
      }
      return joined;
    })
    .replace(/ = /g, ' === ')
    .replace(/ != /g, ' !== ')
    .replace(/ or /g, ' || ')
    .replace(/ and /g, ' && ');
}

var FN_TPL   = fs.readFileSync(path.join(__dirname, 'fn.tpl'), 'utf8');

function createLocaleFn(rules) {

  Object.keys(rules).forEach(function (r) {
    if (FORMS.indexOf(r) < 0) { throw new Error("Don't know this form: "); }
  });

  // Make sure existing forms are ordered
  var forms = Object.keys(rules).sort(function(a, b) {
    return FORMS.indexOf(a) > FORMS.indexOf(b);
  });

  if (forms.length === 1) {
    return {};
  }

  var condition = '';

  forms.forEach(function (form, idx) {
    if (form === 'other') {
      condition += idx;
      return;
    }
    var rule = rules[form].split('@')[0].trim();
    condition += toSingleRule(rule) + ' ? ' + idx + ' : ';
  });

  var shortcuts = _.uniq(condition.match(/[nivwft]\d+/g) || [])
                      .map(function (sh) {
                        return format('%s = %s % %s', sh, sh[0], sh.slice(1));
                      })
                      .join(', ');

  var pmax = _.max('nivftw'.split('').map(function (p, idx) {
    return condition.indexOf(p) < 0 ? -1 : idx;
  })) + 1;

  var fn = _.template(FN_TPL, {
    params: 'nivftw'.slice(0, pmax).split('').join(', '),
    shortcuts: shortcuts,
    condition: condition
  });

  return {
    c:   forms.map(function (f) { return FORMS.indexOf(f); }),
    cFn: fn
  };
}

// Create fixtures for single locale rules
function createLocaleTest(rules) {
  var result = {};

  Object.keys(rules).forEach(function (form) {
    var samples = rules[form].split(/@integer|@decimal/).slice(1);

    result[form] = [];
    samples.forEach(function (sample) {
      result[form] = result[form].concat(createSamples(sample));
    });
  });

  return result;
}

////////////////////////////////////////////////////////////////////////////////

// Process all locales
var compiled = {};
var test = {
  cardinal: {},
  ordinal: {}
};

// Parse plural rules
_.forEach(cardinals.supplemental['plurals-type-cardinal'], function (ruleset, loc) {
  var rules = renameKeys(ruleset);

  compiled[loc.toLowerCase()] = createLocaleFn(rules);
  test.cardinal[loc.toLowerCase()] = createLocaleTest(rules);
});

// Parse ordinal rules
_.forEach(ordinals.supplemental['plurals-type-ordinal'], function (ruleset, loc) {
  var rules = renameKeys(ruleset);

  var res = createLocaleFn(rules);

  if (res.c) {
    compiled[loc.toLowerCase()].o = res.c;
    compiled[loc.toLowerCase()].oFn = res.cFn;
  }

  test.ordinal[loc.toLowerCase()] = createLocaleTest(rules);
});


// Collapse locales with the same rules
var reduced = {};

_.forEach(compiled, function (data, loc) {
  // calculate unique key;
  var uniq = data.cFn + data.oFn;

  if (!reduced[uniq]) {
    reduced[uniq] = {
      locales: [ loc ],
      rules: data
    };
  } else {
    reduced[uniq].locales.push(loc);
  }
});

reduced = _.map(reduced, function(set) { return set; });


// Write code & fixture
var ADD_TPL   = fs.readFileSync(path.join(__dirname, 'add.tpl'), 'utf8');
var INDEX_TPL = fs.readFileSync(path.join(__dirname, 'index_tpl.js'), 'utf8');

var generated = _.template(INDEX_TPL, { version: version })
                    .replace('/*** RULES ***/', _.template(ADD_TPL, { set: reduced }));

fs.writeFileSync(path.resolve(__dirname, '../index.js'), generated);
fs.writeFileSync(path.resolve(__dirname, '../test/test_data.json'), JSON.stringify(test, null, 2));
