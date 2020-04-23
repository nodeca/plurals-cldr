/*
 * Plural functions support (cardinal & ordinal forms)
 *
 * Autogenerated from CLDR:
 *
 *   Version:   ${ version._cldrVersion }
 */

'use strict';


// pluralizers cache
var s = {};

function normalize(loc) {
  var l;
  if (s[loc]) { return loc; }
  l = loc.toLowerCase().replace('_', '-');
  if (s[l]) { return l; }
  l = l.split('-')[0];
  if (s[l]) { return l; }
  return null;
}

function forms(loc) {
  var l = normalize(loc);
  return s[l] ? s[l].c : null;
}

function indexOf(loc, value) {
  var l = normalize(loc);
  if (!l) {
    return -1;
  }

  if (!s[l].cFn) {
    return 0;
  }

  var sval  = String(value),
      f = sval.indexOf('.') < 0 ? '' : sval.split('.')[1],
      v = f.length,
      n = +value,
      i = +(sval.split('.')[0]),
      t = f.length === 0 ? 0 : +f.replace(/0+$/, '');

  return s[l].cFn(n, i, v, +f, t);
}

function plural(loc, value) {
  var l = normalize(loc);
  if (!l) {
    return null;
  }
  return s[l].c[indexOf(l, value)];
}


function o_forms(loc) {
  var l = normalize(loc);
  return s[l] ? s[l].o : null;
}

function o_indexOf(loc, value) {
  var l = normalize(loc);
  if (!l) {
    return -1;
  }

  if (!s[l].oFn) {
    return 0;
  }

  var sval  = String(value),
      f = sval.indexOf('.') < 0 ? '' : sval.split('.')[1],
      v = f.length,
      n = +value,
      i = +(sval.split('.')[0]),
      t = f.length === 0 ? 0 : +f.replace(/0+$/, '');

  return s[l].oFn(n, i, v, +f, t);
}

function ordinal(loc, value) {
  var l = normalize(loc);
  if (!s[l]) {
    return null;
  }
  return s[l].o[o_indexOf(l, value)];
}

module.exports                  = plural;
module.exports.indexOf          = indexOf;
module.exports.forms            = forms;
module.exports.ordinal          = ordinal;
module.exports.ordinal.indexOf  = o_indexOf;
module.exports.ordinal.forms    = o_forms;


////////////////////////////////////////////////////////////////////////////////
/*** RULES ***/
////////////////////////////////////////////////////////////////////////////////
