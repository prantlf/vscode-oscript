import {
  SymbolInformation, DocumentSymbol, SymbolKind, Range, Position
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  FeatureAddition, FeatureDeclaration, FeatureInitialization,
  FunctionDeclaration, ObjectDeclaration, PackageDeclaration,
  ScriptDeclaration
} from 'oscript-parser'
import { simple as simpleWalk } from 'oscript-ast-walker'
import { ensureParsedDocument } from '../language/document'
import { getNodeRange } from '../language/location'
import { logDebug } from '../utils/log'

export function doFlatSymbols(textDocument: TextDocument, extras: any): SymbolInformation[] | undefined {
  const { ast } = ensureParsedDocument(textDocument, extras)
  if (!ast) { // skip invalid documents
    logDebug('invalid document')
    return
  }
  const symbols: SymbolInformation[] = []
  simpleWalk(ast, {
    PackageDeclaration: {
      pre(node: PackageDeclaration) {
        symbols.push(SymbolInformation.create(
          getPackageName(node), SymbolKind.Module, getNodeRange(node)))
      }
    },
    ObjectDeclaration: {
      pre(node: ObjectDeclaration) {
        symbols.push(SymbolInformation.create(
          node.id.raw, SymbolKind.Object, getNodeRange(node)))
      }
    },
    ScriptDeclaration: {
      pre(node: ScriptDeclaration) {
        symbols.push(SymbolInformation.create(
          node.id.raw, SymbolKind.Function, getNodeRange(node)))
      }
    },
    FunctionDeclaration: {
      pre(node: FunctionDeclaration) {
        symbols.push(SymbolInformation.create(
          node.id.raw, SymbolKind.Method, getNodeRange(node)))
        return true
      }
    },
    FeatureDeclaration: {
      pre(node: FeatureDeclaration) {
        symbols.push(SymbolInformation.create(
          node.id.raw, SymbolKind.Property, getNodeRange(node)))
        return true
      }
    },
    FeatureAddition: {
      pre(node: FeatureAddition) {
        symbols.push(SymbolInformation.create(
          node.id.raw, SymbolKind.Property, getNodeRange(node)))
        return true
      }
    },
    FeatureInitialization: {
      pre(node: FeatureInitialization) {
        symbols.push(SymbolInformation.create(
          node.id.raw, SymbolKind.Property, getNodeRange(node)))
        return true
      }
    }
  })
  logDebug('%1 flat symbols found', symbols.length)
  return symbols
}

export function doHierarchicalSymbols(textDocument: TextDocument, extras: any): DocumentSymbol[] | undefined {
  const { ast } = ensureParsedDocument(textDocument, extras)
  if (!ast) { // skip invalid documents
    logDebug('invalid document')
    return
  }
  const symbols: DocumentSymbol[] = []
  const scopes: DocumentSymbol[][] = []
  let currentScope = symbols
  simpleWalk(ast, {
    PackageDeclaration: {
      pre(node: PackageDeclaration) {
        const children: DocumentSymbol[] = []
        currentScope.push(DocumentSymbol.create(
          getPackageName(node), undefined, SymbolKind.Module,
          getNodeRange(node), getNodeRange(node.name), children))
        scopes.push(currentScope)
        currentScope = children
      }
    },
    ObjectDeclaration: {
      pre(node: ObjectDeclaration) {
        const children: DocumentSymbol[] = []
        currentScope.push(DocumentSymbol.create(
          node.id.raw, undefined, SymbolKind.Object, 
          getNodeRange(node), getNodeRange(node.id), children))
        scopes.push(currentScope)
        currentScope = children
      }
    },
    ScriptDeclaration: {
      pre(node: ScriptDeclaration) {
        const children: DocumentSymbol[] = []
        currentScope.push(DocumentSymbol.create(
          node.id.raw, undefined, SymbolKind.Function,
          getNodeRange(node), getNodeRange(node.id), children))
        scopes.push(currentScope)
        currentScope = children
      },
      post() {
        currentScope = scopes.pop()
      }
    },
    FunctionDeclaration: {
      pre(node: FunctionDeclaration) {
        currentScope.push(DocumentSymbol.create(
          node.id.raw, undefined, SymbolKind.Method,
          getNodeRange(node), getNodeRange(node.id)))
        return true
      }
    },
    FeatureDeclaration: {
      pre(node: FeatureDeclaration) {
        currentScope.push(DocumentSymbol.create(
          node.id.raw, undefined, SymbolKind.Property,
          getNodeRange(node), getNodeRange(node.id)))
        return true
      }
    },
    FeatureAddition: {
      pre(node: FeatureAddition) {
        currentScope.push(DocumentSymbol.create(
          node.id.raw, undefined, SymbolKind.Property,
          getNodeRange(node), getNodeRange(node.id)))
        return true
      }
    },
    FeatureInitialization: {
      pre(node: FeatureInitialization) {
        currentScope.push(DocumentSymbol.create(
          node.id.raw, undefined, SymbolKind.Property,
          getNodeRange(node), getNodeRange(node.id)))
        return true
      }
    }
  })
  logDebug('%1 hierarchical symbols found', symbols.length)
  return symbols
}

function getPackageName (pkg: PackageDeclaration): string {
  const { name } = pkg.name
  const lastNamePart = name[name.length - 1]
  return lastNamePart.raw // identifier or legacy alias
}
