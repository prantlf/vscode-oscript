import { workspace, ExtensionContext } from 'vscode'
import { mayAnnounceWhatIsNew } from './what-is-new'
import { startClient } from './client'
import { registerRunScript } from './run-script'

export function activate(context: ExtensionContext): void {
  mayAnnounceWhatIsNew(context)
  const config = workspace.getConfiguration('oscript')
  if (config.get<boolean>('languageServer.enabled')) {
    startClient(context)
    registerRunScript(context)
  }
}
