import {
  WorkspaceEdit, TextDocumentEdit, OptionalVersionedTextDocumentIdentifier,
  TextEdit, Range, Position
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { ensureParsedDocument } from '../language/document'
import { findScopeOfLocal, findLocalsInScope } from '../language/locals'
import { getNodeRange } from '../language/location'
import { logDebug } from '../utils/log'

export function doRenameRequest(textDocument: TextDocument, position: Position, newName: string, extras: any): WorkspaceEdit | undefined {
  const result = ensureParsedDocument(textDocument, extras)
  const { ast } = result
  if (!ast) { // skip invalid documents
    logDebug('invalid document')
    return
  }
  let { rename } = result
  if (rename) extras.rename = undefined // will not be used any more
  else rename = findScopeOfLocal(ast, position) // if no preparation was made
  if (!rename) return // abort if no identifier to rename was found
  const { node, scope } = rename
  const results = findLocalsInScope(scope, node)
  return {
    documentChanges: [
      TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(textDocument.uri, null),
        results.map(({ node }) => TextEdit.replace(getNodeRange(node), newName)))
    ]
  }
}

export function doPrepareRename(textDocument: TextDocument, position: Position, extras: any): Range | undefined {
  const { ast } = ensureParsedDocument(textDocument, extras)
  if (!ast) { // skip invalid documents
    logDebug('invalid document')
    return
  }
  const rename = findScopeOfLocal(ast, position)
  if (!rename) return    // abort if no identifier to rename was found
  extras.rename = rename // remember the data for the following rename request
  return getNodeRange(rename.node)
}
