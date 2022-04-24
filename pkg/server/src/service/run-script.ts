import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { interpret } from 'oscript-interpreter'
import { ensureParsedDocument } from '../language/document'
import { getInterpreterErrorRange } from '../language/location'
import { logDebug } from '../utils/log'

export function runScript(textDocument: TextDocument, extras: any): Diagnostic | undefined {
  const { ast } = ensureParsedDocument(textDocument, extras)
  if (!ast) { // skip invalid documents
    logDebug('invalid document')
    return
  }
  try {
    interpret(ast)
  } catch (error) {
    return Diagnostic.create(getInterpreterErrorRange(error), error.message,
      DiagnosticSeverity.Error, undefined, 'osexec')
  }
}
