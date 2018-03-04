const stringToRegex = require('../dist/stringToRegex.cjs.js')
const pathToRegexp = require('path-to-regexp')

const test = require('tape')

const before = test
const after = test

let keys = []
let keys2 = []


test('/foo/:bar', assert => {

	const re = stringToRegex("/foo/:bar", keys)
	const re2 = pathToRegexp("/foo/:bar", keys2)
	assert.equal(
		re.toString(),
		re2.toString(),
		'it should be parsed into a right regex'
	)
	assert.equal(
		keys.toString(),
		keys2.toString(),
		'it should be parsed into a right array'
	)

	assert.end()
})
