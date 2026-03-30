import React from 'react'
import { useStore } from '../../store'
import type { HeaderEntry } from '../../../shared/types/request.types'

export default function HeadersEditor() {
  const { headers, setHeaders } = useStore()

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }])
  }

  const updateHeader = (index: number, field: keyof HeaderEntry, value: string | boolean) => {
    const next = headers.map((h, i) =>
      i === index ? { ...h, [field]: value } : h
    )
    setHeaders(next)
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 12 }}>Headers</span>
        <button className="btn-sm btn-primary" onClick={addHeader}>+ Add</button>
      </div>

      {headers.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          No custom headers. Click "+ Add" to add headers.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {headers.map((h, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={h.enabled}
              onChange={(e) => updateHeader(i, 'enabled', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
            />
            <input
              value={h.key}
              onChange={(e) => updateHeader(i, 'key', e.target.value)}
              placeholder="Header"
              style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
            <input
              value={h.value}
              onChange={(e) => updateHeader(i, 'value', e.target.value)}
              placeholder="Value"
              style={{ flex: 2, fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
            <button className="btn-sm" onClick={() => removeHeader(i)} style={{ color: 'var(--red)' }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
