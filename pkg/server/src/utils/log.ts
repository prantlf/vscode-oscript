import formatMessage from './format-message'

let warning = false
let debug = false

export type Level = 'error' | 'warning' | 'debug'

export function setLevel (level: Level): void {
  warning = debug = false
  switch (level) {
    case 'debug':
      debug = true
    case 'warning': // eslint-disable-line no-fallthrough
      warning = true
  }
}

export function wantWarning (): boolean {
  return warning
}

export function wantDebug (): boolean {
  return debug
}

export function logError (error: Error, format: string, ...args: any[]): void {
  console.error('[oscript]', formatMessage(format, ...args))
  console.error('[oscript]', error)
}

export function logWarning (error: Error, format: string, ...args: any[]): void {
  if (warning) {
    console.warn('[oscript]', formatMessage(format, ...args))
    console.info('[oscript]', error)
  }
}

export function logDebug (format: string, ...args: any[]): void {
  if (debug) console.log('[oscript]', formatMessage(format, ...args))
}
