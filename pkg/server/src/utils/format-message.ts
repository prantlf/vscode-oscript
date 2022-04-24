// A sprintf-like implementation using `%index` placeholders (index based on 1)
// to insert arguments to the message format.
//
// Example:
//   // Unexpected function in token
//   formatMessage('Unexpected %2 in %1.', 'token', 'function')

export default function formatMessage (format: string, ...args: any[]): string {
  return format.replace(/%(\d)/g, (match, index) => '' + args[index - 1])
}
