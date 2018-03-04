'use strict';

const DEFAULT_DELIMITER = '/';
const DEFAULT_DELIMITERS = './';

const escapeString  = str => str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');

const escapeGroup = group => group.replace(/([=!:$/()])/g, '\\$1');

const PATH_REGEXP = new RegExp(
	[
		// Match escaped characters that would otherwise appear in future matches.
		// This allows the user to escape special characters that won't transform.
		'(\\\\.)',
		// Match Express-style parameters and un-named parameters with a prefix
		// and optional suffixes. Matches appear as:
		//
		// "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
		// "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined]
		'(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?',
	].join('|'),
	'g'
);

const defaultOptions = {
	defaultDelimiter: DEFAULT_DELIMITER,
	delimiters: DEFAULT_DELIMITERS
};

const parse = (str, options = defaultOptions) => {
	let tokens = [];
	let key = 0;
	let index = 0;
	let path = '';
	let pathEscaped = false;
	let res;

	while (res = PATH_REGEXP.exec(str)) {
		const [
			m,
			escaped,
			name,
			capture,
			group,
			modifier,
			...props
		] = res;

		let offset = res.index;

		path += str.slice(index, offset);
		index = offset + m.length;

		// Ignore already escaped sequences.
		if (escaped) {
			path += escaped[1];
			pathEscaped = true;
			continue
		}

		let prev = '';
		let next = str[index];

		if (!pathEscaped && path.length) {
			let k = path.length - 1;

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

		let partial = prev !== '' && next !== undefined && next !== prev;
		let repeat = modifier === '+' || modifier === '*';
		let optional = modifier === '?' || modifier === '*';
		let delimiter = prev || options.defaultDelimiter;
		let pattern = capture || group;

		tokens.push({
			name: name || key++,
			prefix: prev,
			delimiter: delimiter,
			optional: optional,
			repeat: repeat,
			partial: partial,
			pattern: pattern
				? escapeGroup(pattern)
				: '[^' + escapeString(delimiter) + ']+?',
		});
	}

	// Push any remaining characters.
	if (path || index < str.length) {
		tokens.push(path + str.substr(index));
	}

	return tokens
};

const flags = (options={}) => options.sensitive ? '' : 'i';

const defaultOptions$1 = {
	strict: false,
	delimiter: DEFAULT_DELIMITER,
	delimiters: DEFAULT_DELIMITERS,
	end: true,
	endsWith:[]
};
const tokensToRegExp = (tokens, keys, options = defaultOptions$1) => {
	let end = options.end !== false;
	let delimiter = escapeString(options.delimiter);

	let endsWith = []
		.concat(options.endsWith )
		.map(escapeString)
		.concat('$')
		.join('|');
	let route = '';
	let isEndDelimited = false;

	// Iterate over the tokens and create our regexp string.
	for (let i = 0; i < tokens.length; i++) {
		let token = tokens[i];

		if (typeof token === 'string') {
			route += escapeString(token);
			isEndDelimited =
				i === tokens.length - 1 &&
				options.delimiters.indexOf(token[token.length - 1]) > -1;
		} else {
			let prefix = escapeString(token.prefix);
			let capture = token.repeat
				? '(?:' +
					token.pattern +
					')(?:' +
					prefix +
					'(?:' +
					token.pattern +
					'))*'
				: token.pattern;

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

	return new RegExp('^' + route, flags(options))
};

const stringToRegexp = (path, keys, options) => tokensToRegExp(parse(path, options), keys, options);

module.exports = stringToRegexp;
