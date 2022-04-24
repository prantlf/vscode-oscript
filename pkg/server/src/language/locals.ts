import { Position } from 'vscode-languageserver/node'
import {
  Node, Identifier, Program, VariableDeclarator, FunctionDeclaration
} from 'oscript-parser'
import { simple as simpleWalk, findNodeAround } from 'oscript-ast-walker'
import { logDebug } from '../utils/log'

export function findLocalsInScope (scope: any, node: any): { node: Node, parent: Node }[] {
  const results: { node: Node, parent: Node }[] = []
  const { value } = node
  let nestedScope: Node
  let ignoreScope = false
  // Find all occurrences of the identifier denoting a variable or a local function
  simpleWalk(scope, {
    Identifier: {
      post (node: Identifier, state, parent: any) {
        // Skip the scope itself, if it has accidentally the same name. Also,
        // skip nested scopes, if they contain a local declaration using the
        // same identifier value.
        if (scope !== parent && !ignoreScope &&
            mayComeFromVariable(node, parent) && node.value === value) {
          results.push({ node, parent })
        }
      }
    },
    FunctionDeclaration: {
      pre (node: FunctionDeclaration) {
        // Do not limit the initial scope of the variable itself
        if (node === scope) return
        // Skip the nested function if an argument shadows the outer variable
        if (node.params.some(({ id }) => id.value === value)) return true
        nestedScope = node
      },
      post () {
        nestedScope = undefined
        ignoreScope = false
      }
    },
    VariableDeclarator: {
      pre (node: VariableDeclarator) {
        // Skip the rest of the nested function if an inner variable
        // shadows the outer variable
        if (nestedScope && node.id.value === value) {
          ignoreScope = true
          return true
        }
      }
    }
  })
  logDebug('found %1 identifiers', results.length)
  return results
}

export function findScopeOfLocal (ast: Program, position: Position): { node: Node, parent: Node, scope: Node } | null {
  const astPosition = { line: position.line + 1, column: position.character + 1 }
  const scopes = []
  const { type: sourceType } = ast.body
  let script
  logDebug('checking the line %2 and column %3 of a %3',
    position.line + 1, position.character + 1, sourceType)
  if (sourceType === 'ScriptSource') { // all identifiers in scripts are local
    scopes.push(ast.body)
    script = true
  }
  // Firstly, find if the cursor points to an identifier, which can be a locally
  // declared variable or function
  const result = findNodeAround(ast, astPosition, {
    pre (node: Node) {
      const { type } = node
      // Only scopes that may contain variables and local functions are interesting
      if (type === 'FunctionDeclaration' || type === 'ScriptDeclaration') scopes.unshift(node)
    },
    post (node: Node, state, parent: any) {
      const { type } = node
      if (type === 'Identifier' && parent) {
        return parent.type === 'FunctionDeclaration'
          // Only functions in scripts (and not object methods) can be local
          ? script || scopes.length === 2
          // First-level identifiers may come from a variable or local function declaration
          : mayComeFromVariable(node, parent)
      }
      if (type === 'FunctionDeclaration' || type === 'ScriptDeclaration') scopes.shift()
    }
  })
  if (!result) {
    logDebug('no local identifier')
    return null
  }
  const { node, parent } = result
  let [scope] = scopes
  // If an identifier in a local function declaration was selected, set
  // the scope to its parent script
  if (scope === parent) scope = scopes[1]
  if (!scope) {
    logDebug('no surrounding scope or no local for "%1"', (node as Identifier).raw)
    return null
  }
  // Secondly, check if the identifier belongs to a variable or a local function
  const { value } = node as Identifier
  // Look for the declaration of the identifier. Either among the formal
  // parameters, if the scope is a function declaration, ...
  let variable = scope.params && scope.params.some(({ id }) => id.value === value)
  if (!variable) {
    try {
      // ... or inside the scope among its variables and local functions
      simpleWalk(scope, {
        VariableDeclarator: {
          pre (node: VariableDeclarator) {
            if (node.id.value === value) throw new DeclarationFound
          }
        },
        FunctionDeclaration: {
          pre (node: FunctionDeclaration) {
            if (node.id.value === value) throw new DeclarationFound
            // Do not skip the scope of the variable itself, but otherwise
            // do not look for the variable declaration in nested functions.
            // If the variable occurred outside of them, it could not be
            // declared inside of them.
            return node !== scope
          }
        }
      })
    } catch (error) {
      if (error instanceof DeclarationFound) variable = true
      else throw error
    }
  }
  if (!variable) {
    logDebug('not declared in scope of identifier "%1"', (node as Identifier).raw)
    return null
  }
  logDebug('found scope %1 "%2" for "%3"', scope.type, scope.id.raw, (node as Identifier).raw)
  return { node: node, parent, scope }
}

class DeclarationFound {}

function mayComeFromVariable (node: Node, parent: any) {
  const { type: parentType } = parent
  return !((parentType === 'MemberExpression' && parent.property === node) ||
    (parentType === 'Property' && parent.key === node) ||
    parentType === 'XlateExpression')
}

export function declaresLocal (parent: Node) {
  const { type: parentType } = parent
  return parentType === 'VariableDeclarator' || parentType === 'Parameter' ||
    parentType === 'FunctionDeclaration'
}
