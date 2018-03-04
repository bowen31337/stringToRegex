import {DEFAULT_DELIMITER, DEFAULT_DELIMITERS} from './delimiter'
import { escapeString, escapeGroup } from './escape'
import PATH_REGEXP from './pathRegex'

const defaultOptions = {
	defaultDelimiter: DEFAULT_DELIMITER,
	delimiters: DEFAULT_DELIMITERS
}

const parse = (str, options = defaultOptions) => {
	let tokens = []
	let key = 0
	let index = 0
	let path = ''
	let pathEscaped = false
	let res

	while (res = PATH_REGEXP.exec(str)) {
		const [
			m,
			escaped,
			name,
			capture,
			group,
			modifier,
			...props
		] = res

		let offset = res.index

		path += str.slice(index, offset)
		index = offset + m.length

		// Ignore already escaped sequences.
		if (escaped) {
			path += escaped[1]
			pathEscaped = true
			continue
		}

		let prev = ''
		let next = str[index]

		if (!pathEscaped && path.length) {
			let k = path.length - 1

			if (options.delimiters.indexOf(path[k]) > -1) {
				prev = path[k]
				path = path.slice(0, k)
			}
		}

		// Push the current path onto the tokens.
		if (path) {
			tokens.push(path)
			path = ''
			pathEscaped = false
		}

		let partial = prev !== '' && next !== undefined && next !== prev
		let repeat = modifier === '+' || modifier === '*'
		let optional = modifier === '?' || modifier === '*'
		let delimiter = prev || options.defaultDelimiter
		let pattern = capture || group

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
		})
	}

	// Push any remaining characters.
	if (path || index < str.length) {
		tokens.push(path + str.substr(index))
	}

	return tokens
}
export default parse
