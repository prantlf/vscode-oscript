import { Range, Position } from 'vscode-languageserver/node'
import { Node, ParseWarning } from 'oscript-parser'
import { InterpreterError } from 'oscript-interpreter'

export function getNodeRange (node: Node): Range {
  const { start, end } = node.loc
  return Range.create(Position.create(start.line - 1, start.column),
    Position.create(end.line - 1, end.column))
}

export function getParserErrorRange(error: ParseWarning): Range {
  let line: number, start: number, end: number
  if (error.line) {
    line = error.line - 1
    start = error.column - 1
    end = start + error.length
  } else {
    line = start = end = 0
  }
  return Range.create(Position.create(line, start), Position.create(line, end))
}

export function getInterpreterErrorRange(error: InterpreterError): Range {
  let startLine: number, startColumn: number, endLine: number, endColumn: number
  if (error.node && error.node.loc) {
    const { start, end } = error.node.loc
    startLine = start.line - 1
    startColumn = start.column
    endLine = end.line - 1
    endColumn = end.column
  } else {
    startLine = startColumn = endLine = endColumn = 0
  }
  return Range.create(Position.create(startLine, startColumn),
    Position.create(endLine, endColumn))
}
