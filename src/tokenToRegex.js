import {DEFAULT_DELIMITER, DEFAULT_DELIMITERS} from './delimiter'
import {escapeString, escapeGroup} from './escape'
import flags from './flags'

const defaultOptions = {
	strict: false,
	delimiter: DEFAULT_DELIMITER,
	delimiters: DEFAULT_DELIMITERS,
	end: true,
	endsWith:[]
}
const tokensToRegExp = (tokens, keys, options = defaultOptions) => {
	let end = options.end !== false
	let delimiter = escapeString(options.delimiter)

	let endsWith = []
		.concat(options.endsWith )
		.map(escapeString)
		.concat('$')
		.join('|')
	let route = ''
	let isEndDelimited = false

	// Iterate over the tokens and create our regexp string.
	for (let i = 0; i < tokens.length; i++) {
		let token = tokens[i]

		if (typeof token === 'string') {
			route += escapeString(token)
			isEndDelimited =
				i === tokens.length - 1 &&
				options.delimiters.indexOf(token[token.length - 1]) > -1
		} else {
			let prefix = escapeString(token.prefix)
			let capture = token.repeat
				? '(?:' +
					token.pattern +
					')(?:' +
					prefix +
					'(?:' +
					token.pattern +
					'))*'
				: token.pattern

			if (keys) keys.push(token)

			if (token.optional) {
				if (token.partial) {
					route += prefix + '(' + capture + ')?'
				} else {
					route += '(?:' + prefix + '(' + capture + '))?'
				}
			} else {
				route += prefix + '(' + capture + ')'
			}
		}
	}

	if (end) {
		if (!options.strict) route += '(?:' + delimiter + ')?'

		route += endsWith === '$' ? '$' : '(?=' + endsWith + ')'
	} else {
		if (!options.strict) route += '(?:' + delimiter + '(?=' + endsWith + '))?'
		if (!isEndDelimited) route += '(?=' + delimiter + '|' + endsWith + ')'
	}

	return new RegExp('^' + route, flags(options))
}
export default tokensToRegExp
