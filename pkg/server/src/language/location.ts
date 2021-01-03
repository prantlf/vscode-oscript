import { Range, Position } from 'vscode-languageserver/node'
import { Node } from 'oscript-parser'

export function getNodeRange (node: Node): Range {
  const { start, end } = node.loc
  return Range.create(Position.create(start.line - 1, start.column),
    Position.create(end.line - 1, end.column))
}
