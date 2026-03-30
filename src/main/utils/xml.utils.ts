export function formatXml(xml: string): string {
  if (!xml || !xml.trim()) return xml

  try {
    let formatted = ''
    let indent = ''
    const tab = '  '

    const lines = xml
      .replace(/(>)(<)(\/*)/g, '$1\n$2$3')
      .replace(/\r/g, '')
      .split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      if (trimmed.startsWith('</')) {
        indent = indent.substring(tab.length)
      }

      formatted += indent + trimmed + '\n'

      if (
        trimmed.startsWith('<') &&
        !trimmed.startsWith('</') &&
        !trimmed.startsWith('<?') &&
        !trimmed.endsWith('/>') &&
        !trimmed.includes('</')
      ) {
        indent += tab
      }
    }

    return formatted.trimEnd()
  } catch {
    return xml
  }
}
