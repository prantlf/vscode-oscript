import {
  Range, CodeActionContext, CodeAction, CodeActionKind
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { ensureParsedDocument } from '../language/document'
import quickFixes from './quick-fixes'
import { wantDebug, logDebug } from '../utils/log'

export function doCodeAction(textDocument: TextDocument, range: Range, context: CodeActionContext, extras: any): CodeAction[] {
  const { ast } = ensureParsedDocument(textDocument, extras)
  if (!ast) { // skip invalid documents
    logDebug('invalid document')
    return
  }
  const { diagnostics, only } = context
  if (only && !only.includes(CodeActionKind.QuickFix)) {
    logDebug('quick fixes not requested')
    return
  }
  const fixables = diagnostics.filter(({ code }) => code && quickFixes.has(String(code)))
  if (!fixables.length) {
    if (wantDebug()) {
      logDebug('quick fixes not found for problems %1', formatCodes(diagnostics))
    }
    return
  }
  if (wantDebug()) {
    logDebug('quick fixes found for problems %1', formatCodes(fixables))
  }
  return fixables
    .map(problem => {
      const { code, range } = problem
      return quickFixes
        .get(String(code))
        .map(({ title, action }) => CodeAction.create(
          title, { documentChanges: action(textDocument, ast, range) },
          CodeActionKind.QuickFix))
    })
    .flat()
}

function formatCodes (problems) {
  return problems
    .filter(({ code }, index) => problems.indexOf(code) === index)
    .map(({ code }) => code)
    .join(', ')
}
