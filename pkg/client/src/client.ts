import { join } from 'path'
import { workspace, ExtensionContext } from 'vscode'
import {
  LanguageClient, LanguageClientOptions, ServerOptions, TransportKind
} from 'vscode-languageclient/node'

let client: LanguageClient

export function getClient(): LanguageClient {
  return client
}

export function startClient(context: ExtensionContext): void {
  const serverModule = context.asAbsolutePath(join('dist', 'server.js'))

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule, transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6009'] }
    }
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'oscript' }],
    synchronize: {
      configurationSection: ['oscript', '[oscript]'],
      fileEvents: [workspace.createFileSystemWatcher('**/*.{os,osx,e,lxe,json}')]
    }
  }

  client = new LanguageClient('oscript', 'OScript Support', serverOptions, clientOptions)
  context.subscriptions.push(client.start())
}
