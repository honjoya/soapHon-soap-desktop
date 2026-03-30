import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc.types'
import { listOperations } from '../db/repositories/operation.repo'
import { saveRequest, listRequests, listRequestsByProject, deleteRequest } from '../db/repositories/request.repo'
import type { SavedRequest, HeaderEntry, AuthConfig, SoapResponse } from '@shared/types/request.types'

export function registerRequestHandlers() {
  ipcMain.handle(IPC_CHANNELS.OPERATION_LIST, async (_event, projectId: string) => {
    return listOperations(projectId)
  })

  ipcMain.handle(IPC_CHANNELS.REQUEST_SAVE, async (_event, data: {
    id?: string
    operationId: string
    projectId: string
    name: string
    endpointUrl: string
    requestXml: string
    headers: HeaderEntry[]
    auth: AuthConfig
    lastResponse?: SoapResponse | null
  }) => {
    return saveRequest(data)
  })

  ipcMain.handle(IPC_CHANNELS.REQUEST_LIST, async (_event, operationId: string) => {
    return listRequests(operationId)
  })

  ipcMain.handle(IPC_CHANNELS.REQUEST_DELETE, async (_event, id: string) => {
    deleteRequest(id)
    return { success: true }
  })
}
