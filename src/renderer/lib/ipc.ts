import { IPC_CHANNELS } from '../../shared/types/ipc.types'
import type { Project, Operation } from '../../shared/types/project.types'
import type { SavedRequest, SendRequestPayload, SoapResponse, HeaderEntry, AuthConfig } from '../../shared/types/request.types'

const api = window.soapHonAPI

export async function importWsdl(url: string): Promise<{ project: Project; operations: Operation[] }> {
  return api.invoke(IPC_CHANNELS.WSDL_IMPORT, url)
}

export async function listProjects(): Promise<Project[]> {
  return api.invoke(IPC_CHANNELS.PROJECT_LIST)
}

export async function deleteProject(id: string): Promise<void> {
  await api.invoke(IPC_CHANNELS.PROJECT_DELETE, id)
}

export async function updateProjectUrl(id: string, serviceUrl: string): Promise<void> {
  await api.invoke(IPC_CHANNELS.PROJECT_UPDATE_URL, { id, serviceUrl })
}

export async function renameProject(id: string, name: string): Promise<void> {
  await api.invoke(IPC_CHANNELS.PROJECT_RENAME, { id, name })
}

export async function listOperations(projectId: string): Promise<Operation[]> {
  return api.invoke(IPC_CHANNELS.OPERATION_LIST, projectId)
}

export async function saveRequest(data: {
  id?: string
  operationId: string
  projectId: string
  name: string
  endpointUrl: string
  requestXml: string
  headers: HeaderEntry[]
  auth: AuthConfig
  lastResponse?: SoapResponse | null
}): Promise<SavedRequest> {
  return api.invoke(IPC_CHANNELS.REQUEST_SAVE, data)
}

export async function listRequests(operationId: string): Promise<SavedRequest[]> {
  return api.invoke(IPC_CHANNELS.REQUEST_LIST, operationId)
}

export async function deleteRequest(id: string): Promise<void> {
  await api.invoke(IPC_CHANNELS.REQUEST_DELETE, id)
}

export async function sendSoapRequest(payload: SendRequestPayload): Promise<SoapResponse> {
  return api.invoke(IPC_CHANNELS.SOAP_SEND, payload)
}
