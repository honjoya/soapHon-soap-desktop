import React, { useState } from 'react'
import { useStore } from '../../store'
import { listOperations, listRequests, deleteProject, renameProject, updateProjectUrl } from '../../lib/ipc'
import ImportWsdlDialog from '../ImportWsdl/ImportWsdlDialog'
import type { Project, Operation } from '../../../shared/types/project.types'
import type { SavedRequest } from '../../../shared/types/request.types'

export default function Sidebar() {
  const {
    projects, removeProject, updateProject, sidebarWidth,
    setActiveProjectId, setActiveOperationId, activeProjectId, activeOperationId,
    setOperations, operations, setEndpointUrl, setRequestXml, setHeaders, setAuth,
    setResponse, setSavedRequests, savedRequests, setActiveRequestId,
  } = useStore()

  const [showImport, setShowImport] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [expandedOps, setExpandedOps] = useState<Set<string>>(new Set())
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null)
  const [editUrlValue, setEditUrlValue] = useState('')
  const [contextMenuId, setContextMenuId] = useState<string | null>(null)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })

  const toggleProject = async (projectId: string) => {
    const next = new Set(expandedProjects)
    if (next.has(projectId)) {
      next.delete(projectId)
    } else {
      next.add(projectId)
      const ops = await listOperations(projectId)
      setOperations(ops)
      setActiveProjectId(projectId)
    }
    setExpandedProjects(next)
  }

  const selectOperation = async (op: Operation, project: Project) => {
    setActiveProjectId(project.id)
    setActiveOperationId(op.id)
    setEndpointUrl(project.serviceUrl)
    setRequestXml(op.templateXml || '')
    setHeaders([])
    setAuth({ type: 'none' })
    setResponse(null)
    setActiveRequestId(null)
    const reqs = await listRequests(op.id)
    setSavedRequests(reqs)
  }

  const loadSavedRequest = (req: SavedRequest) => {
    setActiveRequestId(req.id)
    setEndpointUrl(req.endpointUrl)
    setRequestXml(req.requestXml)
    setHeaders(req.headers)
    setAuth(req.auth)
    setResponse(req.lastResponse)
  }

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id)
    removeProject(id)
    setContextMenuId(null)
    if (activeProjectId === id) {
      setActiveProjectId(null)
      setActiveOperationId(null)
      setOperations([])
      setSavedRequests([])
    }
  }

  const handleContextMenu = (e: React.MouseEvent, projId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenuId(projId)
    setContextMenuPos({ x: e.clientX, y: e.clientY })
  }

  const startRename = (proj: Project) => {
    setEditingNameId(proj.id)
    setEditNameValue(proj.name)
    setContextMenuId(null)
  }

  const commitRename = async () => {
    if (editingNameId && editNameValue.trim()) {
      await renameProject(editingNameId, editNameValue.trim())
      updateProject(editingNameId, { name: editNameValue.trim() })
    }
    setEditingNameId(null)
  }

  const startEditUrl = (proj: Project) => {
    setEditingUrlId(proj.id)
    setEditUrlValue(proj.serviceUrl)
    setContextMenuId(null)
  }

  const commitEditUrl = async () => {
    if (editingUrlId && editUrlValue.trim()) {
      await updateProjectUrl(editingUrlId, editUrlValue.trim())
      updateProject(editingUrlId, { serviceUrl: editUrlValue.trim() })
      if (editingUrlId === activeProjectId) {
        setEndpointUrl(editUrlValue.trim())
      }
    }
    setEditingUrlId(null)
  }

  return (
    <>
      {/* Close context menu on click anywhere */}
      {contextMenuId && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setContextMenuId(null)}
        />
      )}

      <div style={{
        width: sidebarWidth,
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 10,
      }}>
        <div style={{
          padding: '12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>SoapHon</span>
          <button className="btn-primary btn-sm" onClick={() => setShowImport(true)}>
            + WSDL
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {projects.length === 0 && (
            <div style={{ padding: '20px 12px', color: 'var(--text-muted)', textAlign: 'center', fontSize: 12 }}>
              No projects imported.<br />Click "+ WSDL" to get started.
            </div>
          )}
          {projects.map((proj) => (
            <div key={proj.id}>
              {/* Project header row */}
              <div
                onClick={() => toggleProject(proj.id)}
                onContextMenu={(e) => handleContextMenu(e, proj.id)}
                style={{
                  padding: '6px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: activeProjectId === proj.id ? 'var(--bg-surface)' : 'transparent',
                  borderLeft: activeProjectId === proj.id ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', flex: 1 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {expandedProjects.has(proj.id) ? '▼' : '▶'}
                  </span>
                  {editingNameId === proj.id ? (
                    <input
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') setEditingNameId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      style={{
                        fontSize: 12, fontWeight: 600, padding: '1px 4px',
                        width: '100%', background: 'var(--bg-primary)',
                      }}
                    />
                  ) : (
                    <span
                      style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      onDoubleClick={(e) => { e.stopPropagation(); startRename(proj) }}
                      title="Double-click to rename | Right-click for options"
                    >
                      {proj.name}
                    </span>
                  )}
                </div>
              </div>

              {/* URL edit inline (shown when editing) */}
              {editingUrlId === proj.id && (
                <div style={{ padding: '4px 12px 4px 28px' }} onClick={(e) => e.stopPropagation()}>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                    Webservice URL
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input
                      value={editUrlValue}
                      onChange={(e) => setEditUrlValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEditUrl()
                        if (e.key === 'Escape') setEditingUrlId(null)
                      }}
                      autoFocus
                      style={{
                        flex: 1, fontSize: 11, padding: '3px 6px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                    <button className="btn-primary btn-sm" onClick={commitEditUrl}>OK</button>
                    <button className="btn-sm" onClick={() => setEditingUrlId(null)}>✕</button>
                  </div>
                </div>
              )}

              {/* Expanded operations */}
              {expandedProjects.has(proj.id) && (
                <div style={{ paddingLeft: 20 }}>
                  {/* Show current URL */}
                  {editingUrlId !== proj.id && (
                    <div
                      onClick={(e) => { e.stopPropagation(); startEditUrl(proj) }}
                      style={{
                        padding: '3px 8px', fontSize: 10,
                        color: 'var(--text-muted)', cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginBottom: 2,
                      }}
                      title={`${proj.serviceUrl}\nClick to edit URL`}
                    >
                      {proj.serviceUrl}
                    </div>
                  )}

                  {operations
                    .filter((op) => op.projectId === proj.id)
                    .map((op) => (
                      <div key={op.id}>
                        <div
                          onClick={() => {
                            selectOperation(op, proj)
                            const next = new Set(expandedOps)
                            next.has(op.id) ? next.delete(op.id) : next.add(op.id)
                            setExpandedOps(next)
                          }}
                          style={{
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: 12,
                            borderRadius: 'var(--radius)',
                            background: activeOperationId === op.id ? 'var(--bg-surface)' : 'transparent',
                            color: activeOperationId === op.id ? 'var(--accent)' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 10 }}>POST</span>
                          {op.name}
                        </div>
                        {expandedOps.has(op.id) && savedRequests.filter(r => r.operationId === op.id).map(req => (
                          <div
                            key={req.id}
                            onClick={() => loadSavedRequest(req)}
                            style={{
                              padding: '3px 8px 3px 24px',
                              cursor: 'pointer',
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {req.name}
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Context menu */}
      {contextMenuId && (
        <div style={{
          position: 'fixed',
          left: contextMenuPos.x,
          top: contextMenuPos.y,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '4px 0',
          zIndex: 200,
          minWidth: 160,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {(() => {
            const proj = projects.find(p => p.id === contextMenuId)
            if (!proj) return null
            return (
              <>
                <div
                  onClick={() => startRename(proj)}
                  style={menuItemStyle}
                  onMouseEnter={menuHover}
                  onMouseLeave={menuLeave}
                >
                  Rename
                </div>
                <div
                  onClick={() => startEditUrl(proj)}
                  style={menuItemStyle}
                  onMouseEnter={menuHover}
                  onMouseLeave={menuLeave}
                >
                  Edit URL
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <div
                  onClick={() => handleDeleteProject(proj.id)}
                  style={{ ...menuItemStyle, color: 'var(--red)' }}
                  onMouseEnter={menuHover}
                  onMouseLeave={menuLeave}
                >
                  Delete
                </div>
              </>
            )
          })()}
        </div>
      )}

      {showImport && <ImportWsdlDialog onClose={() => setShowImport(false)} />}
    </>
  )
}

const menuItemStyle: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 12,
  cursor: 'pointer',
  transition: 'background 0.1s',
}

function menuHover(e: React.MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.background = 'var(--bg-hover)'
}
function menuLeave(e: React.MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.background = 'transparent'
}
