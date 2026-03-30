import React, { useState } from 'react'
import { useStore } from '../../store'
import CollapsibleXml from './CollapsibleXml'
import CopyButton from '../common/CopyButton'

type Tab = 'body' | 'headers'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getStatusColor(code: number): string {
  if (code >= 200 && code < 300) return 'var(--green)'
  if (code >= 300 && code < 400) return 'var(--yellow)'
  if (code >= 400 && code < 500) return 'var(--orange)'
  return 'var(--red)'
}

export default function ResponsePanel() {
  const { response, loading } = useStore()
  const [tab, setTab] = useState<Tab>('body')

  if (loading) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', borderTop: '1px solid var(--border)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>⟳</div>
          <div>Sending request...</div>
        </div>
      </div>
    )
  }

  if (!response) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: 13,
      }}>
        Response will appear here after sending a request
      </div>
    )
  }

  const xmlContent = response.bodyFormatted || response.body || ''
  const isXml = xmlContent.trim().startsWith('<')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Status bar */}
      <div style={{
        display: 'flex', gap: 16, padding: '8px 12px',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center', fontSize: 12,
      }}>
        <span style={{
          fontWeight: 700,
          color: getStatusColor(response.statusCode),
          background: 'var(--bg-surface)',
          padding: '2px 10px',
          borderRadius: 'var(--radius)',
        }}>
          {response.statusCode} {response.statusText}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          Time: <strong>{response.timingMs}ms</strong>
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          Size: <strong>{formatBytes(response.responseSize)}</strong>
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          Request: <strong>{formatBytes(response.requestSize)}</strong>
        </span>
        <div style={{ flex: 1 }} />
        <CopyButton getText={() => response.bodyFormatted || response.body || ''} label="Copy Response" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 12px' }}>
        {(['body', 'headers'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              borderRadius: 0,
              fontWeight: tab === t ? 600 : 400,
              fontSize: 12,
            }}
          >
            {t === 'body' ? 'Response Body' : 'Response Headers'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'body' && (
          isXml ? (
            <CollapsibleXml xml={xmlContent} />
          ) : (
            <pre style={{
              margin: 0, padding: 12,
              fontFamily: 'var(--font-mono)', fontSize: 12,
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
            }}>
              {xmlContent || '(empty response)'}
            </pre>
          )
        )}

        {tab === 'headers' && (
          <div style={{ padding: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, width: '30%' }}>Header</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600 }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(response.headers).map(([key, value]) => (
                  <tr key={key}>
                    <td style={{ padding: '4px 10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{key}</td>
                    <td style={{ padding: '4px 10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
