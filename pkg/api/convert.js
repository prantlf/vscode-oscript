const globSync = require('tiny-glob/sync')
const { parse } = require('path')
const { readFileSync, writeFileSync } = require('fs')
const { load } = require('js-yaml')

const files = globSync(`${__dirname}/src/*.yaml`)
const api = {}
for (const file of files) {
  console.log(`Reading ${file}...`)
  const { name } = parse(file)
  api[name] = load(readFileSync(file, 'utf8'))
}
console.log(`Writing dist/api.json...`)
writeFileSync(`${__dirname}/../../dist/api.json`, JSON.stringify(api))
