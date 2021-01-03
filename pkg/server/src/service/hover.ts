import { Hover, MarkupKind, Position, Range } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { objectMembers } from './initialization'
import { ensureParsedDocument } from '../language/document'
import { resolveDirective, resolveIdentifier } from '../language/built-ins'
import { logDebug } from '../utils/log'

export function doHover(textDocument: TextDocument, position: Position, extras: any): Hover | undefined {
  let object, member: string
  // try directives at first; incomplete ones fail the tokenization
  const matched = resolveDirective(textDocument, position, false)
  if (matched) {
    [object, member] = matched
  } else {
    const { tokens } = ensureParsedDocument(textDocument, extras)
    // skip invalid documents
    if (!tokens.length) {
      logDebug('invalid document')
      return
    }
    const matched = resolveIdentifier(tokens, position, false)
    // skip other than object or member identifiers
    if (!matched) return
    ;[object, member] = matched
  }

  const entries = objectMembers.get(object)
  if (!entries) {
    logDebug('no object matched %1', object)
    return
  }
  const entry = entries.get(member)
  if (!entry) {
    logDebug('no member matched %1', member)
    return
  }

  const { synopsis, comment } = entry
  logDebug('hover "%1" and %2 characters of comment', synopsis, comment.length)
  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: `\`${synopsis}\`\n\n${comment}`
    },
    range: Range.create(position,
      Position.create(position.line, position.character + member.length))
  }
}
