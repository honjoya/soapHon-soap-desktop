export interface HeaderEntry {
  key: string
  value: string
  enabled: boolean
}

export type AuthType = 'none' | 'basic' | 'bearer' | 'ws-security'

export interface AuthConfig {
  type: AuthType
  username?: string
  password?: string
  token?: string
}

export interface SavedRequest {
  id: string
  operationId: string
  projectId: string
  name: string
  endpointUrl: string
  requestXml: string
  headers: HeaderEntry[]
  auth: AuthConfig
  lastResponse: SoapResponse | null
  createdAt: string
  updatedAt: string
}

export interface SoapResponse {
  statusCode: number
  statusText: string
  headers: Record<string, string>
  body: string
  bodyFormatted: string
  timingMs: number
  requestSize: number
  responseSize: number
}

export interface SendRequestPayload {
  endpointUrl: string
  soapAction: string | null
  requestXml: string
  headers: HeaderEntry[]
  auth: AuthConfig
}
