import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc.types'
import { sendSoapRequest } from '../services/soap-client.service'
import type { SendRequestPayload } from '@shared/types/request.types'

export function registerSoapHandlers() {
  ipcMain.handle(IPC_CHANNELS.SOAP_SEND, async (_event, payload: SendRequestPayload) => {
    return sendSoapRequest(payload)
  })
}
