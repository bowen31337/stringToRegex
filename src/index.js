import parse from './parse'
import tokensToRegExp from './tokenToRegex'


const stringToRegexp = (path, keys, options) => tokensToRegExp(parse(path, options), keys, options)

export default stringToRegexp
