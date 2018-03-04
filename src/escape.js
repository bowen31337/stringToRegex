const escapeString  = str => str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')

const escapeGroup = group => group.replace(/([=!:$/()])/g, '\\$1')

export { escapeString, escapeGroup }
