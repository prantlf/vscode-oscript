import { window, commands, ExtensionContext, TextEditor } from 'vscode'
import { VersionedTextDocumentIdentifier } from 'vscode-languageclient'
import { getClient } from './client'

export function registerRunScript(context: ExtensionContext): void {
  const command = commands.registerTextEditorCommand('oscript.runScript', runScript)
  context.subscriptions.push(command)
}

async function runScript(editor: TextEditor) {
  const client = getClient()
  const message = await client.sendRequest<Error>('runScript',
    { uri: editor.document.uri.toString() })
  if (message) window.setStatusBarMessage(`osexec: ${message}`)
}
