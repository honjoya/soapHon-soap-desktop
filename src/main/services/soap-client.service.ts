import axios from 'axios'
import https from 'https'
import { applyAuth } from './auth.service'
import { formatXml } from '../utils/xml.utils'
import type { SendRequestPayload, SoapResponse } from '@shared/types/request.types'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

export async function sendSoapRequest(payload: SendRequestPayload): Promise<SoapResponse> {
  const { endpointUrl, soapAction, headers: customHeaders, auth } = payload

  const { headers: allHeaders, requestXml } = applyAuth(auth, customHeaders, payload.requestXml)

  const httpHeaders: Record<string, string> = {
    'Content-Type': 'text/xml; charset=utf-8',
  }

  if (soapAction) {
    httpHeaders['SOAPAction'] = `"${soapAction}"`
  }

  for (const h of allHeaders) {
    if (h.enabled && h.key.trim()) {
      httpHeaders[h.key.trim()] = h.value
    }
  }

  const startTime = performance.now()

  try {
    const response = await axios.post(endpointUrl, requestXml, {
      headers: httpHeaders,
      validateStatus: () => true,
      timeout: 30000,
      responseType: 'text',
      transformResponse: [(data) => data],
      httpsAgent,
    })

    const timingMs = Math.round(performance.now() - startTime)
    const body = typeof response.data === 'string' ? response.data : String(response.data)

    const responseHeaders: Record<string, string> = {}
    for (const [key, val] of Object.entries(response.headers)) {
      responseHeaders[key] = String(val)
    }

    return {
      statusCode: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body,
      bodyFormatted: formatXml(body),
      timingMs,
      requestSize: Buffer.byteLength(requestXml, 'utf-8'),
      responseSize: Buffer.byteLength(body, 'utf-8'),
    }
  } catch (error: any) {
    const timingMs = Math.round(performance.now() - startTime)

    if (error.response) {
      const body = typeof error.response.data === 'string' ? error.response.data : String(error.response.data)
      const responseHeaders: Record<string, string> = {}
      for (const [key, val] of Object.entries(error.response.headers || {})) {
        responseHeaders[key] = String(val)
      }

      return {
        statusCode: error.response.status,
        statusText: error.response.statusText,
        headers: responseHeaders,
        body,
        bodyFormatted: formatXml(body),
        timingMs,
        requestSize: Buffer.byteLength(requestXml, 'utf-8'),
        responseSize: Buffer.byteLength(body, 'utf-8'),
      }
    }

    return {
      statusCode: 0,
      statusText: error.message || 'Network Error',
      headers: {},
      body: `<error>${error.message || 'Connection failed'}</error>`,
      bodyFormatted: `<error>${error.message || 'Connection failed'}</error>`,
      timingMs,
      requestSize: Buffer.byteLength(requestXml, 'utf-8'),
      responseSize: 0,
    }
  }
}
