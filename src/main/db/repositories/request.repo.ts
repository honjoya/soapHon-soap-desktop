import { v4 as uuid } from 'uuid'
import { getDb } from '../database'
import type { SavedRequest, HeaderEntry, AuthConfig, SoapResponse } from '@shared/types/request.types'

export function saveRequest(data: {
  id?: string
  operationId: string
  projectId: string
  name: string
  endpointUrl: string
  requestXml: string
  headers: HeaderEntry[]
  auth: AuthConfig
  lastResponse?: SoapResponse | null
}): SavedRequest {
  const db = getDb()
  const now = new Date().toISOString()

  if (data.id) {
    db.prepare(`
      UPDATE saved_requests SET
        name = ?, endpoint_url = ?, request_xml = ?,
        headers_json = ?, auth_type = ?, auth_config = ?,
        last_response = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.name, data.endpointUrl, data.requestXml,
      JSON.stringify(data.headers), data.auth.type, JSON.stringify(data.auth),
      data.lastResponse ? JSON.stringify(data.lastResponse) : null, now, data.id
    )
    return { ...data, id: data.id, lastResponse: data.lastResponse ?? null, createdAt: now, updatedAt: now }
  }

  const id = uuid()
  db.prepare(`
    INSERT INTO saved_requests (id, operation_id, project_id, name, endpoint_url, request_xml, headers_json, auth_type, auth_config, last_response, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.operationId, data.projectId, data.name, data.endpointUrl, data.requestXml,
    JSON.stringify(data.headers), data.auth.type, JSON.stringify(data.auth),
    data.lastResponse ? JSON.stringify(data.lastResponse) : null, now, now
  )

  return {
    id,
    operationId: data.operationId,
    projectId: data.projectId,
    name: data.name,
    endpointUrl: data.endpointUrl,
    requestXml: data.requestXml,
    headers: data.headers,
    auth: data.auth,
    lastResponse: data.lastResponse ?? null,
    createdAt: now,
    updatedAt: now,
  }
}

export function listRequests(operationId: string): SavedRequest[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM saved_requests WHERE operation_id = ? ORDER BY updated_at DESC').all(operationId) as any[]
  return rows.map(mapRow)
}

export function listRequestsByProject(projectId: string): SavedRequest[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM saved_requests WHERE project_id = ? ORDER BY updated_at DESC').all(projectId) as any[]
  return rows.map(mapRow)
}

export function deleteRequest(id: string): void {
  const db = getDb()
  db.prepare('DELETE FROM saved_requests WHERE id = ?').run(id)
}

function mapRow(row: any): SavedRequest {
  return {
    id: row.id,
    operationId: row.operation_id,
    projectId: row.project_id,
    name: row.name,
    endpointUrl: row.endpoint_url,
    requestXml: row.request_xml,
    headers: row.headers_json ? JSON.parse(row.headers_json) : [],
    auth: row.auth_config ? JSON.parse(row.auth_config) : { type: 'none' },
    lastResponse: row.last_response ? JSON.parse(row.last_response) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
