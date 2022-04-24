import {
  Diagnostic, DiagnosticSeverity, Location, DiagnosticRelatedInformation
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { ParseError, ParseWarning } from 'oscript-parser'
import { ensureParsedDocument } from '../language/document'
import { getParserErrorRange } from '../language/location'

export interface ValidationOptions {
  relatedInformation: boolean
}

export function doValidation(textDocument: TextDocument, extras: any, options: ValidationOptions): Diagnostic[] {
  const { uri } = textDocument
  const { error, warnings } = ensureParsedDocument(textDocument, extras)
  const diagnostics = warnings.map(warning => diagnoseWarning(warning, uri, options))
  if (error) diagnostics.push(diagnoseError(error))
  return diagnostics
}

function diagnoseError(error: ParseError): Diagnostic {
  return Diagnostic.create(getParserErrorRange(error), error.message,
    DiagnosticSeverity.Error, error.code, 'oslint')
}

function diagnoseWarning(warning: ParseWarning, uri: string, options: ValidationOptions): Diagnostic {
  const range = getParserErrorRange(warning)
  const relatedInformation = options.relatedInformation
    ? [DiagnosticRelatedInformation.create(
      Location.create(uri, range),
      'The OScript VM is forgiving and this code will be parsed and executed without problems. However, the language specification is stricter and you should adhere to it.')]
    : undefined
  return Diagnostic.create(range, warning.message,
    DiagnosticSeverity.Warning, warning.code, 'oslint', relatedInformation)
}
