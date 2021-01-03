import { join } from 'path'
import { workspace, ExtensionContext } from 'vscode'
import {
  LanguageClient, LanguageClientOptions, ServerOptions, TransportKind
} from 'vscode-languageclient/node'

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
      fileEvents: [
        workspace.createFileSystemWatcher('**/*.os?(x)'),
        workspace.createFileSystemWatcher('**/*.json')
      ]
    }
  }

  const client = new LanguageClient('oscript', 'OScript Support', serverOptions, clientOptions)
  context.subscriptions.push(client.start())
}
