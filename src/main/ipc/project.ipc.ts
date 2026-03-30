import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc.types'
import { listProjects, deleteProject, updateProjectUrl, renameProject } from '../db/repositories/project.repo'

export function registerProjectHandlers() {
  ipcMain.handle(IPC_CHANNELS.PROJECT_LIST, async () => {
    return listProjects()
  })

  ipcMain.handle(IPC_CHANNELS.PROJECT_DELETE, async (_event, id: string) => {
    deleteProject(id)
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECT_UPDATE_URL, async (_event, data: { id: string; serviceUrl: string }) => {
    updateProjectUrl(data.id, data.serviceUrl)
    return { success: true }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECT_RENAME, async (_event, data: { id: string; name: string }) => {
    renameProject(data.id, data.name)
    return { success: true }
  })
}
