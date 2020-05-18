#!/usr/bin/env node

'use strict';

const fs     = require('fs');
const path   = require('path');

const _    = require('lodash');
const cldr = require('cldr-data');

const cardinals = cldr('supplemental/plurals');
const ordinals  = cldr('supplemental/ordinals');

const version   = cardinals.supplemental.version;

const FORMS = [ 'zero', 'one', 'two', 'few', 'many', 'other' ];

////////////////////////////////////////////////////////////////////////////////
// Helpers

// Strip key prefixes to get clear names: zero / one / two / few / many / other
//
function renameKeys(rules) {
  let result = {};
  Object.keys(rules).forEach(k => {
    result[k.match(/[^-]+$/)] = rules[k];
  });
  return result;
}

// Create array of sample values for single range
// 5~16, 0.04~0.09. Both string & integer forms (when possible)
function fillRange(value) {
  let start = value.split('~')[0];
  let end   = value.split('~')[1];

  let decimals = (start.split('.')[1] || '').length;
  let mult = Math.pow(10, decimals);

  let range = _.range(start * mult, end * mult + 1)
    // round errors to required decimal precision
    .map(val => (val / mult).toFixed(decimals));

  let last = range[range.length - 1];

  // Stupid self check
  if (+end !== +last) {
    throw new Error(`Range create error for ${value}: last value is ${last}`);
  }

  // Now we have array of string samples. Add integers when possible.
  let result = [];

  range.forEach(val => {
    // push test data as String
    result.push(val);
    // push test data as Number if the same
    if (String(+val) === val) { result.push(+val); }
  });

  return result;
}

// Create array of test values for @integer or @decimal
function createSamples(src) {
  let result = [];

  src
    .replace(/…/, '')
    .trim()
    .replace(/,$/, '')
    .split(',')
    .map(function (val) { return val.trim(); })
    .forEach(val => {
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
    .replace(/([nivwft]\d*) (=|\!=) (\d+[.,][.,\d]+)/g, (match, v, cond, range) => {
      // range = 5,8,9 (simple set)
      if (range.indexOf('..') < 0 && range.indexOf(',') >= 0) {
        if (cond === '=') {
          return `IN([ ${range.split(',').join(', ')} ], ${v})`;
        }
        return `!IN([ ${range.split(',').join(', ')} ], ${v})`;
      }
      // range = 0..5 or 0..5,8..20 or 0..5,8
      let conditions = range.split(',').map(interval => {
        // simple value
        if (interval.indexOf('..') < 0) return `${v} ${cond} ${interval}`;
        // range
        let start = interval.split('..')[0],
            end   = interval.split('..')[1];
        if (cond === '=') return `B(${start}, ${end}, ${v})`;

        return `!B(${start}, ${end}, ${v})`;
      });

      let joined;
      if (conditions.length > 1) {
        joined =  `(${conditions.join(cond === '=' ? ' || ' : ' && ')})`;
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

const FN_TPL   = fs.readFileSync(path.join(__dirname, 'fn.tpl'), 'utf8');

function createLocaleFn(rules) {

  Object.keys(rules).forEach(r => {
    if (FORMS.indexOf(r) < 0) { throw new Error("Don't know this form: "); }
  });

  // Make sure existing forms are ordered
  let forms = Object.keys(rules).sort((a, b) => FORMS.indexOf(a) > FORMS.indexOf(b));

  if (forms.length === 1) return {};

  let condition = '';

  forms.forEach(function (form, idx) {
    if (form === 'other') {
      condition += idx;
      return;
    }
    let rule = rules[form].split('@')[0].trim();
    condition += `${toSingleRule(rule)} ? ${idx} : `;
  });

  let shortcuts = _.uniq(condition.match(/[nivwft]\d+/g) || [])
    .map(sh => `${sh} = ${sh[0]} % ${sh.slice(1)}`)
    .join(', ');

  let pmax = _.max(
    'nivftw'.split('').map((p, idx) => condition.indexOf(p) < 0 ? -1 : idx)
  ) + 1;

  let fn = _.template(FN_TPL)({
    params: 'nivftw'.slice(0, pmax).split('').join(', '),
    shortcuts: shortcuts,
    condition: condition
  });

  return {
    c:   forms.map(f => FORMS.indexOf(f)),
    cFn: fn
  };
}

// Create fixtures for single locale rules
function createLocaleTest(rules) {
  let result = {};

  Object.keys(rules).forEach(form => {
    let samples = rules[form].split(/@integer|@decimal/).slice(1);

    result[form] = [];
    samples.forEach(sample => {
      result[form] = result[form].concat(createSamples(sample));
    });
  });

  return result;
}

////////////////////////////////////////////////////////////////////////////////

// Process all locales
let compiled = {};
let test = {
  cardinal: {},
  ordinal: {}
};

// Parse plural rules
_.forEach(cardinals.supplemental['plurals-type-cardinal'], (ruleset, loc) => {
  let rules = renameKeys(ruleset);

  compiled[loc.toLowerCase()] = createLocaleFn(rules);
  test.cardinal[loc.toLowerCase()] = createLocaleTest(rules);
});

// Parse ordinal rules
_.forEach(ordinals.supplemental['plurals-type-ordinal'], (ruleset, loc) => {
  let rules = renameKeys(ruleset);

  let res = createLocaleFn(rules);

  if (res.c) {
    compiled[loc.toLowerCase()].o = res.c;
    compiled[loc.toLowerCase()].oFn = res.cFn;
  }

  test.ordinal[loc.toLowerCase()] = createLocaleTest(rules);
});


// Collapse locales with the same rules
let reduced = {};

_.forEach(compiled, (data, loc) => {
  // calculate unique key;
  let uniq = data.cFn + data.oFn;

  if (!reduced[uniq]) {
    reduced[uniq] = {
      locales: [ loc ],
      rules: data
    };
  } else {
    reduced[uniq].locales.push(loc);
  }
});

reduced = _.map(reduced,  set => set);


// Write code & fixture
const ADD_TPL   = fs.readFileSync(path.join(__dirname, 'add.tpl'), 'utf8');
const INDEX_TPL = fs.readFileSync(path.join(__dirname, 'index_tpl.js'), 'utf8');

let generated = _.template(INDEX_TPL)({ version: version })
  .replace('/*** RULES ***/', _.template(ADD_TPL)({ set: reduced }));

fs.writeFileSync(path.resolve(__dirname, '../index.js'), generated);
fs.writeFileSync(path.resolve(__dirname, '../test/test_data.json'), JSON.stringify(test, null, 2));
