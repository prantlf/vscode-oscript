import { Range, Position } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Token, tokenTypes } from 'oscript-parser'
import { logDebug } from '../utils/log'

// eslint-disable-next-line @typescript-eslint/naming-convention
const { Identifier, Punctuator, KeywordOrIdentifier } = tokenTypes

export function resolveDirective(textDocument: TextDocument, position: Position, empty: boolean): [string, string] | undefined {
  const line = textDocument.getText(Range.create(
    Position.create(position.line, Math.max(position.character - 6, 0)),
    Position.create(position.line, position.character + 6))) // 6 is ifndef length
  const regexp = empty ? /^\s*#(\w+)?/ : /^\s*#(\w+)/
  const match = regexp.exec(line)
  if (match) {
    const directive = match[1]
    logDebug('directive %1 matched', directive)
    return ['directives', directive || '']
  } else {
    logDebug('no directive matched')
  }
}

export function resolveIdentifier(tokens: Token[], position: Position, empty: boolean): [string, string] | undefined {
  let index = findTokenIndex(tokens, position)
  // sanity check; a token should be always found
  if (index < 0) {
    logDebug('no token found')
    return
  }
  const token = tokens[index]
  let member: string
  if (token.type & KeywordOrIdentifier) {
    // remember the identifier and try if it is not a member of an object
    member = String(token.value)
    if (index > 1) {
      const symbol = tokens[index - 1]
      if (isDotSymbol(symbol)) index -= 2
      else index = -1
    } else {
      index = -1
    }
  } else if (empty && isDotSymbol(token)) {
    // allow all identifiers and point to the object
    member = ''
    --index
  } else {
    // only keywords, types, constants, functions, objects and methods are completable
    logDebug('no keyword or identifier matched (%1)', token.type)
    return
  }
  // complete members of the dereferenced object
  let object = 'globals'
  if (index >= 0) {
    const objectToken = tokens[index]
    if (objectToken.type !== Identifier) {
      logDebug('no identifier matched (*%1)', objectToken.type)
      return
    }
    object = String(objectToken.value)
  }
  logDebug('matched identifier %1.%2', object, member || '*')
  return [object, member]
}

function isDotSymbol(token: Token): boolean {
  return token.type === Punctuator && token.value === '.'
}

function findTokenIndex(tokens: Token[], position: Position): number {
  const line = position.line + 1
  let token, tokenIndex
  // find the line with the token using binary search
  let startToken = 0
  let endToken = tokens.length
  for (;;) {
    tokenIndex = startToken + Math.floor((endToken - startToken) / 2)
    token = tokens[tokenIndex]
    if (line === token.line) break
    if (line < token.line) endToken = tokenIndex
    else startToken = tokenIndex + 1
    if (startToken >= endToken) return -1
  }
  // try matching tokens on the same line in left or right directions
  const column = position.character
  const lastToken = tokens.length - 1
  for (;;) {
    const { lineStart } = token
    const startColumn = token.range[0] - lineStart
    const endColumn = token.range[1] - lineStart
    if (column >= startColumn && column < endColumn) return tokenIndex
    if (column < startColumn) {
      if (tokenIndex === 0) return tokenIndex
      token = tokens[--tokenIndex]
      if (token.line !== line) return tokenIndex + 1
    } else {
      if (tokenIndex === lastToken) return tokenIndex
      token = tokens[++tokenIndex]
      if (token.line !== line) return tokenIndex - 1
    }
  }
}
