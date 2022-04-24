import {
  Range, Position, TextDocumentEdit, TextEdit,
  OptionalVersionedTextDocumentIdentifier
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Literal, Program } from 'oscript-parser'
import { findNodeAround } from 'oscript-ast-walker'
import { getNodeRange } from '../language/location'

export interface QuickFix {
  title: string
  action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit
}

export type QuickFixes = Map<string, QuickFix[]>

export default new Map([
  ['W001', [{
    title: 'Replace string delimiters with backticks',
    action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit[] {
      const { start } = range
      const { node } = findNodeAround(ast, { line: start.line + 1, column: start.character + 1 }, 'Literal')
      const { start: stringStart, end: stringEnd } = getNodeRange(node)
      return [TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(document.uri, null), [
          TextEdit.replace(Range.create(
            stringStart, Position.create(stringStart.line, stringStart.character + 1)), '`'),
          TextEdit.replace(Range.create(
            Position.create(stringEnd.line, stringEnd.character - 1), stringEnd), '`')
        ])]
    }
  }, {
    title: 'Replace line breaks with spaces',
    action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit[] {
      const { start } = range
      const { node } = findNodeAround(ast, { line: start.line + 1, column: start.character + 1 }, 'Literal')
      const string = replaceLineBreaks((node as Literal).value)
      const { start: stringStart, end: stringEnd } = getNodeRange(node)
      return [TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(document.uri, null), [
          TextEdit.replace(Range.create(
            Position.create(stringStart.line, stringStart.character + 1),
            Position.create(stringEnd.line, stringEnd.character - 1)), string)
        ])]
    }
  }, {
    title: 'Delete line breaks',
    action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit[] {
      const { start } = range
      const { node } = findNodeAround(ast, { line: start.line + 1, column: start.character + 1 }, 'Literal')
      const string = deleteLineBreaks((node as Literal).value)
      const { start: stringStart, end: stringEnd } = getNodeRange(node)
      return [TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(document.uri, null), [
          TextEdit.replace(Range.create(
            Position.create(stringStart.line, stringStart.character + 1),
            Position.create(stringEnd.line, stringEnd.character - 1)), string)
        ])]
    }
  }]],
  ['W002', [{
    title: 'Delete the backslash',
    action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit[] {
      const { start } = range
      return [TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(document.uri, null), [
          TextEdit.del(Range.create(start, Position.create(start.line, start.character + 1)))
        ])]
    }
  }, {
    title: 'Insert a space after the backslash',
    action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit[] {
      const { start } = range
      return [TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(document.uri, null), [
          TextEdit.insert(Position.create(start.line, start.character + 1), ' ')
        ])]
    }
  }]],
  ['W003', [{
    title: 'Insert a dummy variable name after the directive',
    action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit[] {
      const { start } = range
      const text = document.getText(range)
      const match = /^(#\w+)(\s*)/.exec(text)
      const lead = match[1].length
      const spaces = match[2]
      return [TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(document.uri, null), [
          spaces
            ? TextEdit.replace(Range.create(
              Position.create(start.line, start.character + lead),
              Position.create(start.line, start.character + lead + spaces.length)), ' DUMMY')
            : TextEdit.insert(Position.create(start.line, start.character + lead), ' DUMMY')
        ])]
    }
  }]],
  ['W004', [{
    title: 'Replace the current modifier with "public"',
    action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit[] {
      return [TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(document.uri, null), [
          TextEdit.replace(range, 'public')
        ])]
    }
  }]],
  ['W005', [{
    title: 'Remove the characters after the directive',
    action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit[] {
      const { end } = range
      const text = document.getText(range)
      const match = /^(#\w+)/.exec(text)
      const tail = text.length - match[1].length
      return [TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(document.uri, null), [
          TextEdit.del(Range.create(Position.create(end.line, end.character - tail), end))
        ])]
    }
  }, {
    title: 'Make a single-line comment from the characters after the directive',
    action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit[] {
      const { start } = range
      const text = document.getText(range)
      const match = /^(#\w+)/.exec(text)
      const head = match[1].length
      return [TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(document.uri, null), [
          TextEdit.insert(Position.create(start.line, start.character + head), ' //')
        ])]
    }
  }, {
    title: 'Put the characters after the directive to a multi-line comment',
    action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit[] {
      const { start } = range
      const text = document.getText(range)
      const match = /^(#\w+)/.exec(text)
      const head = match[1].length
      return [TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(document.uri, null), [
          TextEdit.insert(Position.create(start.line, start.character + head), ' /*'),
          TextEdit.insert(Position.create(start.line, start.character + text.length), ' */')
        ])]
    }
  }]],
  ['W006', [{
    title: 'Delete the semicolon',
    action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit[] {
      return [TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(document.uri, null), [
          TextEdit.del(range)
        ])]
    }
  }]],
  ['W007', [{
    title: 'Insert a semicolon before the keyword "end"',
    action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit[] {
      return [TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(document.uri, null), [
          TextEdit.insert(range.start, '; ')
        ])]
    }
  }, {
    title: 'Insert a line break before the keyword "end"',
    action (document: TextDocument, ast: Program, range: Range): TextDocumentEdit[] {
      const { start } = range
      const text = document.getText(Range.create(Position.create(start.line, 0), start))
      const match = /^(\s*)(.*\S)(\s*)$/.exec(text)
      const indent = match[1] || ''
      const actions = [TextEdit.insert(start, `\n${indent}`)]
      const tail = match[3]
      if (tail) {
        actions.unshift(TextEdit.del(Range.create(
          Position.create(start.line, start.character - tail.length), start)))
      }
      return [TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(document.uri, null), actions)]
    }
  }]]
])

export function replaceLineBreaks (text) {
  return text.replace(/\r?\n\s*/g, ' ').replace(/\r\s*([^\n])/g, ' $1')
}

export function deleteLineBreaks (text) {
  return text.replace(/\r?\n\s*/g, '').replace(/\r\s*([^\n])/g, '$1')
}
