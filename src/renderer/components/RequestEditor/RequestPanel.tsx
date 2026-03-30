import React, { useState } from 'react'
import { useStore } from '../../store'
import { sendSoapRequest, saveRequest } from '../../lib/ipc'
import UrlBar from './UrlBar'
import XmlEditor from './XmlEditor'
import HeadersEditor from './HeadersEditor'
import AuthConfig from './AuthConfig'
import CopyButton from '../common/CopyButton'

type Tab = 'body' | 'headers' | 'auth'

function formatXml(xml: string): string {
  if (!xml || !xml.trim()) return xml
  try {
    let formatted = ''
    let indent = ''
    const tab = '  '
    const lines = xml
      .replace(/(>)(<)(\/*)/g, '$1\n$2$3')
      .replace(/\r/g, '')
      .split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (trimmed.startsWith('</')) {
        indent = indent.substring(tab.length)
      }
      formatted += indent + trimmed + '\n'
      if (
        trimmed.startsWith('<') &&
        !trimmed.startsWith('</') &&
        !trimmed.startsWith('<?') &&
        !trimmed.endsWith('/>') &&
        !trimmed.includes('</')
      ) {
        indent += tab
      }
    }
    return formatted.trimEnd()
  } catch {
    return xml
  }
}

export default function RequestPanel() {
  const {
    endpointUrl, requestXml, setRequestXml, headers, auth, setResponse, setLoading, loading,
    activeOperationId, activeProjectId, operations,
    activeRequestId, setActiveRequestId, setSavedRequests, savedRequests,
  } = useStore()
  const [tab, setTab] = useState<Tab>('body')
  const [saveName, setSaveName] = useState('')
  const [showSave, setShowSave] = useState(false)

  const activeOp = operations.find((o) => o.id === activeOperationId)

  const handleSend = async () => {
    if (!endpointUrl || !requestXml) return
    setLoading(true)
    setResponse(null)
    try {
      const result = await sendSoapRequest({
        endpointUrl,
        soapAction: activeOp?.soapAction || null,
        requestXml,
        headers,
        auth,
      })
      setResponse(result)
    } catch (err: any) {
      setResponse({
        statusCode: 0,
        statusText: err.message || 'Error',
        headers: {},
        body: '',
        bodyFormatted: '',
        timingMs: 0,
        requestSize: 0,
        responseSize: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!activeOperationId || !activeProjectId || !saveName.trim()) return
    const saved = await saveRequest({
      id: activeRequestId || undefined,
      operationId: activeOperationId,
      projectId: activeProjectId,
      name: saveName.trim(),
      endpointUrl,
      requestXml,
      headers,
      auth,
      lastResponse: useStore.getState().response,
    })
    setActiveRequestId(saved.id)
    const existing = savedRequests.filter((r) => r.id !== saved.id)
    setSavedRequests([saved, ...existing])
    setShowSave(false)
    setSaveName('')
  }

  const handleFormat = () => {
    if (requestXml.trim()) {
      setRequestXml(formatXml(requestXml))
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'body', label: 'Body' },
    { key: 'headers', label: 'Headers' },
    { key: 'auth', label: 'Auth' },
  ]

  if (!activeOperationId) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: 14,
      }}>
        Select an operation from the sidebar to get started
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
      <UrlBar onSend={handleSend} loading={loading} />

      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '0 12px', gap: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
              borderRadius: 0,
              fontWeight: tab === t.key ? 600 : 400,
              fontSize: 12,
            }}
          >
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn-sm" onClick={handleFormat} title="Format/indent the request XML">
          Format
        </button>
        <CopyButton getText={() => requestXml} label="Copy Request" />
        {!showSave ? (
          <button className="btn-sm" onClick={() => { setShowSave(true); setSaveName(activeOp?.name || '') }}>
            Save
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Request name"
              style={{ width: 160, fontSize: 11, padding: '3px 6px' }}
              autoFocus
            />
            <button className="btn-primary btn-sm" onClick={handleSave}>OK</button>
            <button className="btn-sm" onClick={() => setShowSave(false)}>X</button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'body' && <XmlEditor />}
        {tab === 'headers' && <HeadersEditor />}
        {tab === 'auth' && <AuthConfig />}
      </div>
    </div>
  )
}
