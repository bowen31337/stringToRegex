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
)

export default PATH_REGEXP
