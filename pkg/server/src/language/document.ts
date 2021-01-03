import { Range, Position } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  parseText, SourceType, Token, tokenTypes,
  ParseError, ParseWarning, Node, Program
} from 'oscript-parser'
import { extname } from 'path'
import { logWarning, logDebug } from '../utils/log'

// eslint-disable-next-line @typescript-eslint/naming-convention
const { Identifier, Punctuator, KeywordOrIdentifier } = tokenTypes

const sourceTypes: { [ext: string]: SourceType } = {
  '.e': 'script',
  '.os': 'object',
  '.osx': 'dump'
}

export interface DocumentExtras {
  path: string
  error: ParseError
  ast: Program | null
  tokens: Token[]
  warnings: ParseWarning[]
  rename: { node: Node, scope: Node } | null | undefined
}

export function ensureParsedDocument(textDocument: TextDocument, extras: DocumentExtras): DocumentExtras {
  if (extras.ast === undefined) {
    const sourceFile = extras.path
    const sourceType = sourceTypes[extname(sourceFile)]
    try {
      const program = parseText(textDocument.getText(), {
        tokens: true, locations: true, ranges: true, rawIdentifiers: true,
        sourceType, sourceFile
      })
      logDebug('document parsed: %1 tokens, %2 warnings',
        program.tokens.length, program.warnings.length)
      extras.error = null
      extras.ast = program
      extras.tokens = program.tokens || []
      extras.warnings = program.warnings
    } catch (error) {
      logWarning(error, 'document parsing failed: %1 tokens, %2 warnings',
        error.tokens.length, error.warnings.length)
      extras.error = error
      extras.ast = null
      extras.tokens = error.tokens || []
      extras.warnings = error.warnings
    }
  }
  return extras
}
