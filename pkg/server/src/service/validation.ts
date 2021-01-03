import {
  Diagnostic, DiagnosticSeverity, Range, Position, Location,
  DiagnosticRelatedInformation
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { ParseError, ParseWarning } from 'oscript-parser'
import { ensureParsedDocument } from '../language/document'

export interface ValidationOptions {
  relatedInformation: boolean
}

export function doValidation(textDocument: TextDocument, originalExtras: any, options: ValidationOptions): Diagnostic[] {
  const { uri } = textDocument
  const { error, warnings } = ensureParsedDocument(textDocument, originalExtras)
  const diagnostics = warnings.map(warning => diagnoseWarning(warning, uri, options))
  if (error) diagnostics.push(diagnoseError(error))
  return diagnostics
}

function diagnoseError(error: ParseError): Diagnostic {
  return Diagnostic.create(getErrorRange(error), error.message,
    DiagnosticSeverity.Error, error.code, 'oslint')
}

function diagnoseWarning(warning: ParseWarning, uri: string, options: ValidationOptions): Diagnostic {
  const range = getErrorRange(warning)
  const relatedInformation = options.relatedInformation
    ? [DiagnosticRelatedInformation.create(
      Location.create(uri, range),
      'The OScript VM is forgiving and this code will be parsed and executed without problems. However, the language specification is stricter and you should adhere to it.')]
    : undefined
  return Diagnostic.create(range, warning.message,
    DiagnosticSeverity.Warning, warning.code, 'oslint', relatedInformation)
}

function getErrorRange(error: ParseWarning): Range {
  let line: number, start: number,  end: number
  if (error.line) {
    line = error.line - 1
    start = error.column - 1
    end = start + error.length
  } else {
    line = start = end = 0
  }
  return Range.create(Position.create(line, start), Position.create(line, end))
}
