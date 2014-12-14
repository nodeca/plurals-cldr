
var FORMS = [ 'zero', 'one', 'two', 'few', 'many', 'other' ];

function unpack(i) { return FORMS[i]; }

// adds given `rule` pluralizer for given `locales` into `storage`
function add(locales, rule) {
  var i;

  rule.c = rule.c ? rule.c.map(unpack) : [ 'other' ];
  rule.o = rule.o ? rule.o.map(unpack) : [ 'other' ];

  for (i = 0; i < locales.length; i++) {
    s[locales[i]] = rule;
  }
}

function B(x, y, val) { return x <= val && val <= y && val % 1 === 0; }
function IN(set, val) { return set.indexOf(val) >= 0; }

<% _.forEach(set, function(element) { %>
add(${ JSON.stringify(element.locales).replace(/"/g, "'").replace(/([\[,])/g, '$1 ').replace(']', ' ]') }, {<% if (element.rules.c) { var _has_c = true; %>
  c: ${ JSON.stringify(element.rules.c).replace(/"/g, "'").replace(/([\[,])/g, '$1 ').replace(']', ' ]') },
  cFn: ${ element.rules.cFn.replace(/^/mg, '  ').replace(/^  /, '') }<% } if (element.rules.o) { if (_has_c) { print(',') } %>
  o: ${ JSON.stringify(element.rules.o).replace(/"/g, "'").replace(/([\[,])/g, '$1 ').replace(']', ' ]') },
  oFn: ${ element.rules.oFn.replace(/^/mg, '  ').replace(/^  /, '') }<% } %>
});
<% }); %>