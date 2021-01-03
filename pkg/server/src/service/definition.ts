import { Position, Location } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { ensureParsedDocument } from '../language/document'
import { findScopeOfLocal, findLocalsInScope, declaresLocal } from '../language/locals'
import { getNodeRange } from '../language/location'
import { logDebug } from '../utils/log'

export function doDefinition(textDocument: TextDocument, position: Position, extras: any): Location | undefined {
  const { ast } = ensureParsedDocument(textDocument, extras)
  if (!ast) { // skip invalid documents
    logDebug('invalid document')
    return
  }
  const result = findScopeOfLocal(ast, position) // if no preparation was made
  if (!result) return // abort if no variable identifier
  const { node, scope } = result
  const { uri } = textDocument
  const results = findLocalsInScope(scope, node)
  const declaration = results.find(({ parent }) => declaresLocal(parent))
  if (!declaration) {
    logDebug('declaration not found')
    return
  }
  return Location.create(uri, getNodeRange(declaration.node))
}
