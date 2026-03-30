import { v4 as uuid } from 'uuid'
import { getDb } from '../database'
import type { Operation } from '@shared/types/project.types'

export function createOperation(data: {
  projectId: string
  name: string
  soapAction: string | null
  inputMessage: string | null
  outputMessage: string | null
  templateXml: string | null
}): Operation {
  const db = getDb()
  const id = uuid()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO operations (id, project_id, name, soap_action, input_message, output_message, template_xml, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.projectId, data.name, data.soapAction, data.inputMessage, data.outputMessage, data.templateXml, now)

  return {
    id,
    projectId: data.projectId,
    name: data.name,
    soapAction: data.soapAction,
    inputMessage: data.inputMessage,
    outputMessage: data.outputMessage,
    templateXml: data.templateXml,
    createdAt: now,
  }
}

export function listOperations(projectId: string): Operation[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM operations WHERE project_id = ? ORDER BY name').all(projectId) as any[]
  return rows.map(mapRow)
}

function mapRow(row: any): Operation {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    soapAction: row.soap_action,
    inputMessage: row.input_message,
    outputMessage: row.output_message,
    templateXml: row.template_xml,
    createdAt: row.created_at,
  }
}
