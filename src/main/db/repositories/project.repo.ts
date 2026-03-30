import { v4 as uuid } from 'uuid'
import { getDb } from '../database'
import type { Project } from '@shared/types/project.types'

export function createProject(data: {
  name: string
  wsdlUrl: string
  serviceUrl: string
  wsdlRaw: string | null
}): Project {
  const db = getDb()
  const id = uuid()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO projects (id, name, wsdl_url, service_url, wsdl_raw, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.wsdlUrl, data.serviceUrl, data.wsdlRaw, now, now)

  return {
    id,
    name: data.name,
    wsdlUrl: data.wsdlUrl,
    serviceUrl: data.serviceUrl,
    wsdlRaw: data.wsdlRaw,
    createdAt: now,
    updatedAt: now,
  }
}

export function listProjects(): Project[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as any[]
  return rows.map(mapRow)
}

export function deleteProject(id: string): void {
  const db = getDb()
  db.prepare('DELETE FROM projects WHERE id = ?').run(id)
}

export function updateProjectUrl(id: string, serviceUrl: string): void {
  const db = getDb()
  db.prepare("UPDATE projects SET service_url = ?, updated_at = datetime('now') WHERE id = ?").run(serviceUrl, id)
}

export function renameProject(id: string, name: string): void {
  const db = getDb()
  db.prepare("UPDATE projects SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, id)
}

function mapRow(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    wsdlUrl: row.wsdl_url,
    serviceUrl: row.service_url,
    wsdlRaw: row.wsdl_raw,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
