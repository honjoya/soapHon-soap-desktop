import React from 'react'
import { useStore } from '../../store'
import { updateProjectUrl } from '../../lib/ipc'

interface Props {
  onSend: () => void
  loading: boolean
}

export default function UrlBar({ onSend, loading }: Props) {
  const { endpointUrl, setEndpointUrl, activeProjectId, updateProject } = useStore()

  const handleUrlChange = (url: string) => {
    setEndpointUrl(url)
  }

  const handleUrlBlur = async () => {
    if (activeProjectId && endpointUrl.trim()) {
      await updateProjectUrl(activeProjectId, endpointUrl.trim())
      updateProject(activeProjectId, { serviceUrl: endpointUrl.trim() })
    }
  }

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '10px 12px',
      borderBottom: '1px solid var(--border)',
      alignItems: 'center',
    }}>
      <span style={{
        background: 'var(--green)',
        color: 'var(--bg-primary)',
        fontWeight: 700,
        fontSize: 11,
        padding: '3px 8px',
        borderRadius: 'var(--radius)',
        flexShrink: 0,
      }}>
        POST
      </span>
      <input
        value={endpointUrl}
        onChange={(e) => handleUrlChange(e.target.value)}
        onBlur={handleUrlBlur}
        placeholder="Endpoint URL"
        style={{
          flex: 1,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
        }}
        onKeyDown={(e) => e.key === 'Enter' && onSend()}
      />
      <button
        className="btn-primary"
        onClick={onSend}
        disabled={loading || !endpointUrl}
        style={{ minWidth: 80 }}
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  )
}
