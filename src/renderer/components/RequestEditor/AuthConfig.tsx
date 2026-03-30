import React from 'react'
import { useStore } from '../../store'
import type { AuthType } from '../../../shared/types/request.types'

export default function AuthConfig() {
  const { auth, setAuth } = useStore()

  const handleTypeChange = (type: AuthType) => {
    setAuth({ type })
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          Authentication Type
        </label>
        <select
          value={auth.type}
          onChange={(e) => handleTypeChange(e.target.value as AuthType)}
          style={{ width: 200 }}
        >
          <option value="none">None</option>
          <option value="basic">Basic Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="ws-security">WS-Security</option>
        </select>
      </div>

      {auth.type === 'basic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Username
            </label>
            <input
              value={auth.username || ''}
              onChange={(e) => setAuth({ ...auth, username: e.target.value })}
              placeholder="username"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password"
              value={auth.password || ''}
              onChange={(e) => setAuth({ ...auth, password: e.target.value })}
              placeholder="password"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {auth.type === 'bearer' && (
        <div style={{ maxWidth: 400 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Token
          </label>
          <input
            value={auth.token || ''}
            onChange={(e) => setAuth({ ...auth, token: e.target.value })}
            placeholder="Bearer token"
            style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
        </div>
      )}

      {auth.type === 'ws-security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
            The WS-Security header (UsernameToken) will be automatically injected into the SOAP envelope.
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Username
            </label>
            <input
              value={auth.username || ''}
              onChange={(e) => setAuth({ ...auth, username: e.target.value })}
              placeholder="username"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password"
              value={auth.password || ''}
              onChange={(e) => setAuth({ ...auth, password: e.target.value })}
              placeholder="password"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
