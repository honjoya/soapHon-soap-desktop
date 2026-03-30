import React, { useState } from 'react'
import { useStore } from '../../store'
import { importWsdl, listOperations } from '../../lib/ipc'

interface Props {
  onClose: () => void
}

export default function ImportWsdlDialog({ onClose }: Props) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { addProject, setOperations, setActiveProjectId } = useStore()

  const handleImport = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    try {
      const { project, operations } = await importWsdl(url.trim())
      addProject(project)
      setActiveProjectId(project.id)
      setOperations(operations)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to import WSDL')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-primary)', borderRadius: 8, padding: 24,
          width: 500, border: '1px solid var(--border)',
        }}
      >
        <h3 style={{ marginBottom: 16, fontSize: 16 }}>Import WSDL</h3>

        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          WSDL URL
        </label>
        <input
          type="text"
          placeholder="https://example.com/service?wsdl"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          style={{ width: '100%', marginBottom: 12 }}
          autoFocus
        />

        {error && (
          <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleImport} disabled={loading || !url.trim()}>
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
