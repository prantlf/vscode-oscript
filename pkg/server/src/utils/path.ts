import { WorkspaceFolder } from 'vscode-languageserver/node'
import { sep } from 'path'

export function uriToProjectPath (workspaceFolders: WorkspaceFolder[], workspaceRoot: string, uri: string): string {
  for (const folder of workspaceFolders) {
    const path = tryMatchPath(folder.name, uri)
    if (path) return `${folder.name}${sep}${path}`
  }
  if (workspaceRoot) {
    const path = tryMatchPath(workspaceRoot, uri)
    if (path) return path
  }
  return uri
}

function tryMatchPath (folderUri: string, fileUri: string): string | undefined {
  if (fileUri.startsWith(folderUri)) {
    const path = fileUri.substr(folderUri.length)
    const start = path.charCodeAt(0)
    return start === 47 || start === 92 ? path.substr(1) : path // /\
  }
}
