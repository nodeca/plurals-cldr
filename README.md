plurals-cldr - plurals support for JS
=====================================

[![Build Status](https://travis-ci.org/nodeca/plurals-cldr.svg?branch=master)](https://travis-ci.org/nodeca/plurals-cldr)
[![NPM version](https://img.shields.io/npm/v/plurals-cldr.svg)](https://www.npmjs.org/package/plurals-cldr)
[![Coverage Status](https://img.shields.io/coveralls/nodeca/plurals-cldr.svg)](https://coveralls.io/r/nodeca/plurals-cldr)

Key benefits:

- Competely automated code generation from CLDR on update.
- Generated code automatically tested with CLDR fixtures.
- Both `cardinal` and `ordinal` forms support.
- Rules for all languages are stored in single file in very compact form.


### Installation

__node.js:__

```bash
$ npm install plurals-cldr
```

__browser:__

```bash
$ bower install plurals-cldr
```

### Rebuild

```bash
make clean
make generate
```

### API

#### .(locale, number)

Returns form name for given number. Number can be passed as string to keep
tailing decimal zeros. If locale not supported, returns `null`.


```js
var plural = require('plural-cldr');

// Get cardinal form name
//
// Params:
//
// - locale
// - number (Number|String)
//
plural('ru', 0)   // -> 'many'
plural('ru', 1)   // -> 'one'
plural('ru', 2)   // -> 'few'
plural('ru', 19)  // -> 'many'
plural('ru', 0.5) // -> 'other'
```


#### .forms(locale)

Returns array of available forms for specified locale. If locale not supported,
returns `null`.


#### .indexOf(locale, number)

Returns index of form for specified locale. That's convenient, if you wish
to implement lookup from compact ordered list, like
[babelfish](https://github.com/nodeca/babelfish/) does.

If locale not supported, function returns `-1`.

Order of forms is the same for all languages: `zero`, `one`, `two`, `few`,
`many`, `other`. Remove unavailable forms, and you will get indexes of each.


#### .ordinal(), .ordinal.forms(), ordinal.indexOf()

The same as above, but for ordinal forms.


### References

1. [CLDR downloads](http://cldr.unicode.org/index/downloads)
2. [Latest chart](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html)
3. [Syntax description](http://www.unicode.org/reports/tr35/tr35-numbers.html#Language_Plural_Rules)


### License

[Mit](https://github.com/nodeca/plurals-cldr/blob/master/LICENSE).
