import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/types/ipc.types'

const channels = Object.values(IPC_CHANNELS)

const api = {
  invoke: (channel: string, ...args: any[]) => {
    if (channels.includes(channel as any)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    throw new Error(`Invalid IPC channel: ${channel}`)
  },
}

contextBridge.exposeInMainWorld('soapHonAPI', api)
