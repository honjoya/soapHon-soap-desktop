import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbDir = path.join(userDataPath, 'data')
  fs.mkdirSync(dbDir, { recursive: true })

  const dbPath = path.join(dbDir, 'soaphon.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations(db)
  return db
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      wsdl_url    TEXT NOT NULL,
      service_url TEXT NOT NULL,
      wsdl_raw    TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS operations (
      id              TEXT PRIMARY KEY,
      project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name            TEXT NOT NULL,
      soap_action     TEXT,
      input_message   TEXT,
      output_message  TEXT,
      template_xml    TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS saved_requests (
      id              TEXT PRIMARY KEY,
      operation_id    TEXT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
      project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name            TEXT NOT NULL,
      endpoint_url    TEXT NOT NULL,
      request_xml     TEXT NOT NULL,
      headers_json    TEXT,
      auth_type       TEXT DEFAULT 'none',
      auth_config     TEXT,
      last_response   TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
