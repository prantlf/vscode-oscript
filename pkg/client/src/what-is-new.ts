import { workspace, ExtensionContext, MessageItem, window, commands, Uri } from 'vscode'
import { version, homepage } from '../../../package.json'

const VERSION_ID = 'oscriptVersion'

export function mayAnnounceWhatIsNew(context: ExtensionContext): void {
  const previousVersion = context.globalState.get<string>(VERSION_ID)
  if (previousVersion === undefined || version !== previousVersion) {
    context.globalState.update(VERSION_ID, version)
    if (previousVersion === undefined) return // no message on new installation

    const config = workspace.getConfiguration('oscript')
    const announcementType = config.get<string>('whatIsNew.change')
    const upgradeType = getVersionChange(previousVersion)

    if (announcementType === 'major' && upgradeType === 'major' ||
        announcementType === 'minor' && (upgradeType === 'major' || upgradeType === 'minor') ||
        announcementType !== 'none' && upgradeType) showWhatsNewMessage(version)
  }
}

function getVersionChange(previousVersion: string): 'major' | 'minor' | 'patch' | false {
  const currentParts = version.split('.')
  const previousParts = previousVersion.split('.')
  if (currentParts[0] > previousParts[0]) return 'major'
  if (currentParts[0] === previousParts[0] &&
      currentParts[1] > previousParts[1]) return 'minor'
  if (currentParts[0] === previousParts[0] &&
      currentParts[1] === previousParts[1] &&
      currentParts[2] > previousParts[2]) return 'patch'
  return false
}

async function showWhatsNewMessage() {
  const message = `The OScript language support has been upgraded to version ${version} - check out what is new!`
  const actions: MessageItem[] = [{ title: 'Homepage' }, { title: 'Release Notes' }]
  const result = await window.showInformationMessage(message, ...actions)
  if (result === actions[0]) {
    await commands.executeCommand('vscode.open', Uri.parse(homepage))
  } else if(result === actions[1]) {
    const repository = homepage.replace(/#[^#]+$/, '')
    await commands.executeCommand('vscode.open',
      Uri.parse(`${repository}/blob/master/CHANGELOG.md#readme`))
  }
}
