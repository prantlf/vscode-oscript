import {
  CompletionItem, CompletionList, CompletionItemKind, MarkupKind, InsertTextFormat
} from 'vscode-languageserver/node'
import { TextDocument, Position } from 'vscode-languageserver-textdocument'
import { objectMembers, completionItemKinds } from './initialization'
import { ensureParsedDocument } from '../language/document'
import { resolveDirective, resolveIdentifier } from '../language/built-ins'
import { wantDebug, logDebug } from '../utils/log'

export function doCompletion(textDocument: TextDocument, position: Position, extras: any): CompletionList | undefined {
  let object, member: string
  // try directives at first; incomplete ones fail the tokenization
  const matched = resolveDirective(textDocument, position, true)
  if (matched) {
    [object, member] = matched
  } else {
    const { tokens } = ensureParsedDocument(textDocument, extras)
    // skip invalid documents
    if (!tokens.length) {
      logDebug('invalid or empty document')
      return
    }
    // point to the last typed character
    if (position.character > 0) --position.character 
    const matched = resolveIdentifier(tokens, position, true)
    // skip other than object or member identifiers
    if (!matched) return
    ;[object, member] = matched
  }

  const entries = objectMembers.get(object)
  if (!entries) {
    logDebug('no object matched %1', object)
    return
  }

  // find all members starting with the typed identifier part
  const items = []
  for (const [key, entry] of entries.entries()) {
    if (!key.startsWith(member)) continue
    const kind = completionItemKinds.get(entry.type) || CompletionItemKind.Text
    items.push({
      // sortText/preselect ranks higher than other completions and shows up first
      label: entry.id, kind, sortText: '-1', preselect: true, data: entry
    })
  }
  if (wantDebug()) {
    logDebug('complete with %1', JSON.stringify(items.map(({ label }) => label)))
  }
  return { items, isIncomplete: true }
}

export function doCompletionResolve(item: CompletionItem): CompletionItem {
  const entry = item.data
  if (entry) {
    const { synopsis } = entry
    logDebug('complete %1 with %2', item.label, synopsis)
    item.detail = synopsis
    item.documentation = {
      kind: MarkupKind.Markdown,
      value: entry.comment
    }
    if (entry.space) {
      item.commitCharacters = [' ']
      item.insertText = `${entry.id} `
    } else {
      if (entry.commit) item.commitCharacters = [entry.commit]
      if (entry.insert) {
        item.insertTextFormat = InsertTextFormat.Snippet
        item.insertText = entry.insert
      }
    }
  } else {
    logDebug('no complete resolution for %1', item.label)
  }
  return item
}
