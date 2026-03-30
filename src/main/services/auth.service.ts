import type { AuthConfig, HeaderEntry } from '@shared/types/request.types'

export function applyAuth(
  auth: AuthConfig,
  headers: HeaderEntry[],
  requestXml: string
): { headers: HeaderEntry[]; requestXml: string } {
  const resultHeaders = [...headers]

  switch (auth.type) {
    case 'basic': {
      if (auth.username && auth.password) {
        const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')
        resultHeaders.push({ key: 'Authorization', value: `Basic ${encoded}`, enabled: true })
      }
      break
    }
    case 'bearer': {
      if (auth.token) {
        resultHeaders.push({ key: 'Authorization', value: `Bearer ${auth.token}`, enabled: true })
      }
      break
    }
    case 'ws-security': {
      if (auth.username && auth.password) {
        requestXml = injectWsSecurity(requestXml, auth.username, auth.password)
      }
      break
    }
  }

  return { headers: resultHeaders, requestXml }
}

function injectWsSecurity(xml: string, username: string, password: string): string {
  const wsseHeader = `
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                   xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${escapeXml(username)}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${escapeXml(password)}</wsse:Password>
        <wsu:Created>${new Date().toISOString()}</wsu:Created>
      </wsse:UsernameToken>
    </wsse:Security>`

  const headerRegex = /(<soap:Header\s*\/?>)/i
  const headerMatch = xml.match(headerRegex)

  if (headerMatch) {
    if (headerMatch[0].endsWith('/>')) {
      return xml.replace(headerRegex, `<soap:Header>${wsseHeader}\n  </soap:Header>`)
    }
    return xml.replace(headerRegex, `${headerMatch[0]}${wsseHeader}`)
  }

  const envelopeBodyRegex = /(<soap:Body)/i
  return xml.replace(envelopeBodyRegex, `<soap:Header>${wsseHeader}\n  </soap:Header>\n  $1`)
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
