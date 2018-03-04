(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.captureNsequentialChars = factory());
}(this, (function () { 'use strict';

var DEFAULT_DELIMITER = '/';
var DEFAULT_DELIMITERS = './';

var escapeString = function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
};

var escapeGroup = function escapeGroup(group) {
  return group.replace(/([=!:$/()])/g, '\\$1');
};

var PATH_REGEXP = new RegExp([
// Match escaped characters that would otherwise appear in future matches.
// This allows the user to escape special characters that won't transform.
'(\\\\.)',
// Match Express-style parameters and un-named parameters with a prefix
// and optional suffixes. Matches appear as:
//
// "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
// "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined]
'(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'].join('|'), 'g');

var toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

var defaultOptions = {
	defaultDelimiter: DEFAULT_DELIMITER,
	delimiters: DEFAULT_DELIMITERS
};

var parse = function parse(str) {
	var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultOptions;

	var tokens = [];
	var key = 0;
	var index = 0;
	var path = '';
	var pathEscaped = false;
	var res = void 0;

	while (res = PATH_REGEXP.exec(str)) {
		var _res = res,
		    _res2 = toArray(_res),
		    m = _res2[0],
		    escaped = _res2[1],
		    name = _res2[2],
		    capture = _res2[3],
		    group = _res2[4],
		    modifier = _res2[5],
		    props = _res2.slice(6);

		var offset = res.index;

		path += str.slice(index, offset);
		index = offset + m.length;

		// Ignore already escaped sequences.
		if (escaped) {
			path += escaped[1];
			pathEscaped = true;
			continue;
		}

		var prev = '';
		var next = str[index];

		if (!pathEscaped && path.length) {
			var k = path.length - 1;

			if (options.delimiters.indexOf(path[k]) > -1) {
				prev = path[k];
				path = path.slice(0, k);
			}
		}

		// Push the current path onto the tokens.
		if (path) {
			tokens.push(path);
			path = '';
			pathEscaped = false;
		}

		var partial = prev !== '' && next !== undefined && next !== prev;
		var repeat = modifier === '+' || modifier === '*';
		var optional = modifier === '?' || modifier === '*';
		var delimiter = prev || options.defaultDelimiter;
		var pattern = capture || group;

		tokens.push({
			name: name || key++,
			prefix: prev,
			delimiter: delimiter,
			optional: optional,
			repeat: repeat,
			partial: partial,
			pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?'
		});
	}

	// Push any remaining characters.
	if (path || index < str.length) {
		tokens.push(path + str.substr(index));
	}

	return tokens;
};

var flags = function flags() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return options.sensitive ? '' : 'i';
};

var defaultOptions$1 = {
	strict: false,
	delimiter: DEFAULT_DELIMITER,
	delimiters: DEFAULT_DELIMITERS,
	end: true,
	endsWith: []
};
var tokensToRegExp = function tokensToRegExp(tokens, keys) {
	var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultOptions$1;

	var end = options.end !== false;
	var delimiter = escapeString(options.delimiter);

	var endsWith = [].concat(options.endsWith).map(escapeString).concat('$').join('|');
	var route = '';
	var isEndDelimited = false;

	// Iterate over the tokens and create our regexp string.
	for (var i = 0; i < tokens.length; i++) {
		var token = tokens[i];

		if (typeof token === 'string') {
			route += escapeString(token);
			isEndDelimited = i === tokens.length - 1 && options.delimiters.indexOf(token[token.length - 1]) > -1;
		} else {
			var prefix = escapeString(token.prefix);
			var capture = token.repeat ? '(?:' + token.pattern + ')(?:' + prefix + '(?:' + token.pattern + '))*' : token.pattern;

			if (keys) keys.push(token);

			if (token.optional) {
				if (token.partial) {
					route += prefix + '(' + capture + ')?';
				} else {
					route += '(?:' + prefix + '(' + capture + '))?';
				}
			} else {
				route += prefix + '(' + capture + ')';
			}
		}
	}

	if (end) {
		if (!options.strict) route += '(?:' + delimiter + ')?';

		route += endsWith === '$' ? '$' : '(?=' + endsWith + ')';
	} else {
		if (!options.strict) route += '(?:' + delimiter + '(?=' + endsWith + '))?';
		if (!isEndDelimited) route += '(?=' + delimiter + '|' + endsWith + ')';
	}

	return new RegExp('^' + route, flags(options));
};

var stringToRegexp = function stringToRegexp(path, keys, options) {
  return tokensToRegExp(parse(path, options), keys, options);
};

return stringToRegexp;

})));
