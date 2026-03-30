import React, { useEffect } from 'react'
import { useStore } from './store'
import { listProjects } from './lib/ipc'
import Sidebar from './components/Sidebar/Sidebar'
import RequestPanel from './components/RequestEditor/RequestPanel'
import ResponsePanel from './components/ResponseViewer/ResponsePanel'

export default function App() {
  const setProjects = useStore((s) => s.setProjects)
  const sidebarWidth = useStore((s) => s.sidebarWidth)

  useEffect(() => {
    listProjects().then(setProjects).catch(console.error)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginLeft: sidebarWidth,
        }}
      >
        <RequestPanel />
        <ResponsePanel />
      </div>
    </div>
  )
}
