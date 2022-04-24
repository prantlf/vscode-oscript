import {
  createConnection, TextDocuments, ProposedFeatures, InitializeParams,
  DidChangeConfigurationNotification, CompletionItem, CompletionList,
  Hover, TextDocumentPositionParams, TextDocumentSyncKind, InitializeResult,
  ShowMessageNotification, MessageType, WorkspaceFolder, WorkspaceFoldersChangeEvent,
  DocumentSymbolParams, SymbolInformation, DocumentSymbol, RenameParams,
  WorkspaceEdit, Range, CodeActionKind, CodeActionParams, CodeAction,
  ReferenceParams, Location, TextDocumentIdentifier, TextDocumentChangeEvent,
  DidChangeWatchedFilesParams, DidChangeConfigurationParams
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  doInitialize, doValidation, doCompletion, doCompletionResolve, doHover,
  doFlatSymbols, doHierarchicalSymbols, doDefinition, doReferences,
  doRenameRequest, doPrepareRename, doCodeAction, runScript
} from './service'
import { uriToProjectPath } from './utils/path'
import { logError, logDebug, wantDebug, setLevel, Level } from './utils/log'

interface OScriptSettings {
  languageServer: { enabled: boolean }
  validation: { enabled: boolean }
  completion: { enabled: boolean }
  hover: { enabled: boolean }
  symbols: { enabled: boolean }
  definition: { enabled: boolean }
  references: { enabled: boolean }
  rename: { enabled: boolean }
  quickFixes: { enabled: boolean }
  logging: { level: Level }
}
const defaultSettings: OScriptSettings = {
  languageServer: { enabled: true },
  validation: { enabled: true },
  completion: { enabled: true },
  hover: { enabled: true },
  symbols: { enabled: true },
  definition: { enabled: true },
  references: { enabled: true },
  rename: { enabled: true },
  quickFixes: { enabled: true },
  logging: { level: 'error' }
}
let globalSettings = defaultSettings

interface DocumentExtras {
  path: string
  settings: OScriptSettings
  error?: any
  ast?: any
  tokens?: any
  warnings?: any
}
const documentExtras: Map<string, DocumentExtras> = new Map

let workspaceRoot: string | null
let workspaceFolders: WorkspaceFolder[] = []
let hasConfigurationCapability = false
let hasWorkspaceFolderCapability = false
let hasDiagnosticRelatedInformationCapability = false
let hasHierarchicalDocumentSymbolSupport = false
let hasRenamePreparationSupport = false
let hasCodeActionLiteralSupport = false

const connection = createConnection(ProposedFeatures.all)

const documents = new TextDocuments(TextDocument)
const pendingValidationRequests: Map<string, NodeJS.Timer> = new Map
const validationDelay = 200

connection.onInitialize((params: InitializeParams): InitializeResult => {
  workspaceRoot = params.rootUri
  workspaceFolders = params.workspaceFolders || []

  const capabilities = params.capabilities
  hasConfigurationCapability = !!(
    capabilities.workspace && capabilities.workspace.configuration)
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && capabilities.workspace.workspaceFolders)
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation)
  hasHierarchicalDocumentSymbolSupport = !!(
    capabilities.textDocument &&
    capabilities.textDocument.documentSymbol &&
    capabilities.textDocument.documentSymbol.hierarchicalDocumentSymbolSupport)
  hasRenamePreparationSupport = !!(
    capabilities.textDocument &&
    capabilities.textDocument.rename &&
    capabilities.textDocument.rename.prepareSupport)
  hasCodeActionLiteralSupport = !!(
    capabilities.textDocument &&
    capabilities.textDocument.codeAction &&
    capabilities.textDocument.codeAction.codeActionLiteralSupport
  )

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['.', '#', '(', '[']
      },
      hoverProvider: true,
      documentSymbolProvider: true,
      definitionProvider: true,
      referencesProvider: true,
      codeActionProvider: hasCodeActionLiteralSupport ? { codeActionKinds: [CodeActionKind.QuickFix] } : true,
      renameProvider: hasRenamePreparationSupport ? { prepareProvider: true } : true
    }
  }
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: { changeNotifications: true, supported: true }
    }
  }
  return result
})

connection.onInitialized((): void => {
  if (hasConfigurationCapability) {
    connection.client.register(DidChangeConfigurationNotification.type, undefined)
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(updateWorkspaceFolders)
  }
  updateLogLevel()
    .then(() => {
      if (wantDebug()) {
        logDebug('initialized with workspace root "%1" and workspace folders %2, supporting configuration - %3, workspace folders - %4, related information - %5, hierarchical symbols - %6, rename preparation - %7 and code actions - %8',
          workspaceRoot, JSON.stringify(workspaceFolders.map(({ name, uri }) => ([name, uri]))),
          hasConfigurationCapability, hasWorkspaceFolderCapability,
          hasDiagnosticRelatedInformationCapability,
          hasHierarchicalDocumentSymbolSupport, hasRenamePreparationSupport,
          hasCodeActionLiteralSupport)
      }
    })
    .then(doInitialize)
    .catch(error => {
      logError(error, 'initialization failed')
      connection.sendNotification(ShowMessageNotification.type.method,
        { message: error.message, type: MessageType.Error })
    })
})

function updateWorkspaceFolders(event: WorkspaceFoldersChangeEvent): void {
  if (wantDebug()) {
    logDebug('workspace folders removed - %1, added - %2',
      JSON.stringify(event.removed.map(({ name }) => name)),
      JSON.stringify(event.added.map(({ name, uri }) => ([name, uri]))))
  }
  workspaceFolders = workspaceFolders
    .filter(current => !event.removed.some(removed => removed.uri === current.uri))
    .filter(current => !event.added.some(added => added.uri === current.uri))
    .concat(event.added)
}

function updateLogLevel () {
  return connection.workspace
    .getConfiguration('oscript')
    .then(settings => setLevel(settings.logging.level))
}

connection.onDidChangeConfiguration((event: DidChangeConfigurationParams): void => {
  logDebug('configuration changed')
  documentExtras.clear()
  if (!hasConfigurationCapability) {
    globalSettings = event.settings.oscript || defaultSettings
  }
  updateLogLevel()
    .then(() => documents.all().forEach(triggerValidation))
    .catch(error => {
      logError(error, 'initialization failed')
      connection.sendNotification(ShowMessageNotification.type.method,
        { message: error.message, type: MessageType.Error })
    })
})

async function getDocumentSettings(uri: string): Promise<OScriptSettings> {
  if (!hasConfigurationCapability) return globalSettings
  const settings = await connection.workspace.getConfiguration({
    scopeUri: uri, section: 'oscript'
  })
  if (wantDebug()) {
    logDebug('new document settings: %2', uri, JSON.stringify({
      languageServer: settings.languageServer.enabled,
      validation: settings.validation.enabled,
      completion: settings.completion.enabled,
      hover: settings.hover.enabled,
      symbols: settings.symbols.enabled,
      rename: settings.rename.enabled
    }))
  }
  return settings
}

async function ensureDocumentExtras(document: TextDocument): Promise<DocumentExtras> {
  const { uri } = document
  let extras = documentExtras.get(uri)
  if (!extras) {
    logDebug('new document extras')
    extras = {
      path: uriToProjectPath(workspaceFolders, workspaceRoot, uri),
      settings: await getDocumentSettings(uri)
    }
    documentExtras.set(uri, extras)
  }
  return extras
}

documents.onDidChangeContent((event: TextDocumentChangeEvent<TextDocument>): void => {
  const { document } = event
  const { uri } = document
  logDebug('document changed - %1', uri)
  const extras = documentExtras.get(uri)
  if (extras) invalidateExtras(extras)
  triggerValidation(document)
})

documents.onDidOpen((event: TextDocumentChangeEvent<TextDocument>): void => {
  const { document } = event
  logDebug('document opened - %1', document.uri)
  triggerValidation(document)
})

function invalidateExtras(extras: DocumentExtras): void {
  extras.error = extras.ast = extras.tokens = extras.warnings = undefined
}

documents.onDidClose((event: TextDocumentChangeEvent<TextDocument>): void => {
  const { document } = event
  const { uri } = document
  logDebug('document closed - %1', uri)
  documentExtras.delete(uri)
  cancelValidation(document)
})

connection.onDidChangeWatchedFiles((event: DidChangeWatchedFilesParams): void => {
  if (wantDebug()) {
    logDebug('watched files changed - %1',
      JSON.stringify(event.changes.map(({ uri }) => uri)))
  }
  event.changes.forEach(change => {
    const document = documents.get(change.uri)
    if (document) triggerValidation(document)
  })
})

function cleanPendingValidation(uri: string): void {
  const request = pendingValidationRequests.get(uri)
  if (request) {
    clearTimeout(request)
    pendingValidationRequests.delete(uri)
  }
}

function triggerValidation(document: TextDocument): void {
  const { uri } = document
  cleanPendingValidation(uri)
  pendingValidationRequests.set(uri, setTimeout(() => {
    pendingValidationRequests.delete(uri)
    validateTextDocument(document)
  }, validationDelay))
}

function cancelValidation(document: TextDocument): void {
  const { uri } = document
  cleanPendingValidation(uri)
  connection.sendDiagnostics({ uri, diagnostics: [] })
}

async function validateTextDocument(document: TextDocument): Promise<void> {
  const extras = await prepareDocument(document, 'validating document', 'validation')
  if (!extras) return
  const diagnostics = doValidation(document, extras,
    { relatedInformation: hasDiagnosticRelatedInformationCapability })
  connection.sendDiagnostics({ uri: document.uri, diagnostics })
}

connection.onCompletion(async (documentPositionParams: TextDocumentPositionParams): Promise<CompletionList | undefined> => {
  const { textDocument, position } = documentPositionParams
  const [document, extras] = await prepareDocumentHandler (textDocument, 'completion', 'completion')
  if (!document) return
  return doCompletion(document, position, extras)
})

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  logDebug('completion resolution requested for %1', item.label)
  return doCompletionResolve(item)
})

connection.onHover(async (documentPositionParams: TextDocumentPositionParams): Promise<Hover | undefined> => {
  const { textDocument, position } = documentPositionParams
  const [document, extras] = await prepareDocumentHandler (textDocument, 'hover', 'hover')
  if (!document) return
  return doHover(document, position, extras)
})

connection.onDocumentSymbol(async (documentSymbolParams: DocumentSymbolParams): Promise<SymbolInformation[] | DocumentSymbol[]> => {
  const { textDocument } = documentSymbolParams
  const [document, extras] = await prepareDocumentHandler (textDocument, 'symbols', 'symbols')
  if (!document) return
  return hasHierarchicalDocumentSymbolSupport
    ? doHierarchicalSymbols(document, extras)
    : doFlatSymbols(document, extras)
})

connection.onDefinition(async (documentPositionParams: TextDocumentPositionParams): Promise<Location> => {
  const { textDocument, position } = documentPositionParams
  const [document, extras] = await prepareDocumentHandler (textDocument, 'definition', 'definition')
  if (!document) return
  return doDefinition(document, position, extras)
})

connection.onReferences(async (referenceParams: ReferenceParams): Promise<Location[]> => {
  const { textDocument, position, context } = referenceParams
  const [document, extras] = await prepareDocumentHandler (textDocument, 'references', 'references')
  if (!document) return
  return doReferences(document, position, context, extras)
})

connection.onCodeAction(async (codeActionParams: CodeActionParams): Promise<CodeAction[]> => {
  const { textDocument, range, context } = codeActionParams
  const [document, extras] = await prepareDocumentHandler (textDocument, 'code action', 'quickFixes')
  if (!document) return
  return doCodeAction(document, range, context, extras)
})

connection.onRenameRequest(async (renameParams: RenameParams): Promise<WorkspaceEdit | undefined> => {
  const { textDocument, position, newName } = renameParams
  const [document, extras] = await prepareDocumentHandler (textDocument, 'rename', 'rename')
  if (!document) return
  return doRenameRequest(document, position, newName, extras)
})

connection.onPrepareRename(async (documentPositionParams: TextDocumentPositionParams): Promise<Range | undefined> => {
  const { textDocument, position } = documentPositionParams
  const [document, extras] = await prepareDocumentHandler (textDocument, 'rename preparation', 'rename')
  if (!document) return
  return doPrepareRename(document, position, extras)
})

connection.onRequest('runScript', async (textDocument: TextDocumentIdentifier): Promise<string | undefined> => {
  const [document, extras] = await prepareDocumentHandler (textDocument, 'run script')
  if (!document) return
  const diagnostic = runScript(document, extras)
  if (diagnostic) {
    connection.sendDiagnostics({ uri: document.uri, diagnostics: [diagnostic] })
    connection.sendNotification(ShowMessageNotification.type.method,
      { message: diagnostic.message, type: MessageType.Error })
    return diagnostic.message
  }
})

async function prepareDocumentHandler (documentId: TextDocumentIdentifier, eventName: string, enablingFlag?: string): Promise<[TextDocument?, DocumentExtras?]> {
  const document = documents.get(documentId.uri)
  if (!document) {
    logDebug('%1 rejected for unknown document', eventName)
    return []
  }
  const extras = await prepareDocument(document, eventName, enablingFlag)
  return extras ? [document, extras] : []
}

async function prepareDocument(document: TextDocument, eventName: string, enablingFlag?: string): Promise<DocumentExtras | undefined> {
  logDebug('%1 requested for %2', eventName, document.uri)
  const extras = await ensureDocumentExtras(document)
  const { settings } = extras
  if (!(settings.languageServer.enabled && (!enablingFlag || settings[enablingFlag].enabled))) return
  return extras
}

documents.listen(connection)

connection.listen()
