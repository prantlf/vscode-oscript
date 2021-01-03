import { Position, ReferenceContext, Location } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { ensureParsedDocument } from '../language/document'
import { findScopeOfLocal, findLocalsInScope, declaresLocal } from '../language/locals'
import { getNodeRange } from '../language/location'
import { logDebug } from '../utils/log'

export function doReferences(textDocument: TextDocument, position: Position, context: ReferenceContext, extras: any): Location[] {
  const { ast } = ensureParsedDocument(textDocument, extras)
  if (!ast) { // skip invalid documents
    logDebug('invalid document')
    return
  }
  const result = findScopeOfLocal(ast, position) // if no preparation was made
  if (!result) return // abort if no identifier to rename was found
  const { node, scope } = result
  const { uri } = textDocument
  let results = findLocalsInScope(scope, node)
  if (!context.includeDeclaration) {
    results = results.filter(({ parent }) => !declaresLocal(parent))
  }
  return results.map(({ node }) => Location.create(uri, getNodeRange(node)))
}
