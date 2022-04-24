import { CompletionItemKind } from 'vscode-languageserver/node'
import { readFile } from 'fs/promises'
import { logDebug } from '../utils/log'

export let completionItemKinds: Map<string, CompletionItemKind>

interface ApiEntry {
  id: string
  type: string
  synopsis: string
  comment: string
  commit?: string
  insert?: string
  space?: boolean
}
export let objectMembers: Map<string, Map<string, ApiEntry>>

export function doInitialize(): Promise<void> {
  // backward conversion - keep in sync with CompletionItemKind
  completionItemKinds = new Map([
    ['Text', 1], ['Method', 2], ['Function', 3], ['Constructor', 4],
    ['Field', 5], ['Variable', 6], ['Class', 7], ['Interface', 8],
    ['Module', 9], ['Property', 10], ['Unit', 11], ['Value', 12], ['Enum', 13],
    ['Keyword', 14], ['Snippet', 15], ['Color', 16], ['File', 17],
    ['Reference', 18], ['Folder', 19], ['EnumMember', 20], ['Constant', 21],
    ['Struct', 22], ['Event', 23], ['Operator', 24], ['TypeParameter', 25]])
  return loadApi()
}

async function loadApi(): Promise<void> {
  const promises: Promise<void>[] = []
  objectMembers = new Map
  // create the global members ahead to be able to add built-in objects there
  const globals = new Map
  objectMembers.set('globals', globals)
  // api contains object names as keys pointing to their members as arrays
  logDebug('loading api.json')
  const api = JSON.parse(await readFile(`${__dirname}/api.json`, 'utf8'))
  Object.keys(api).forEach((name: string) => {
    logDebug('registering %1', name)
    const global = name === 'globals'
    // built-in objects with a capital letter (ignore "globals" and "directives")
    if (name.charCodeAt(0) < 97) {
      globals.set(name.toLowerCase(),
        { id: name, type: 'Struct', synopsis: name, comment: '', commit: '.' })
    }
    // the map for globals has been already created
    const members = global ? globals : new Map
    for (const entry of api[name]) {
      if (entry.synopsis === undefined) entry.synopsis = entry.id
      if (entry.comment === undefined) entry.comment = ''
      if (entry.type === 'Function' || entry.type === 'Method') {
        entry.commit = '('
        entry.insert = `${entry.id}($0)`
      }
      members.set(entry.id.toLowerCase(), entry)
    }
    // the map for globals has been already added
    if (!global) objectMembers.set(name.toLowerCase(), members)
  })
}
