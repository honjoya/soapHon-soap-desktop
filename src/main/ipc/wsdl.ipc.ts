import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/types/ipc.types'
import { parseWsdl } from '../services/wsdl-parser.service'
import { createProject } from '../db/repositories/project.repo'
import { createOperation } from '../db/repositories/operation.repo'
import type { Project, Operation } from '@shared/types/project.types'

export function registerWsdlHandlers() {
  ipcMain.handle(IPC_CHANNELS.WSDL_IMPORT, async (_event, url: string): Promise<{ project: Project; operations: Operation[] }> => {
    const parsed = await parseWsdl(url)

    const project = createProject({
      name: parsed.serviceName,
      wsdlUrl: url,
      serviceUrl: parsed.endpointUrl,
      wsdlRaw: parsed.rawXml,
    })

    const operations: Operation[] = []
    for (const op of parsed.operations) {
      const operation = createOperation({
        projectId: project.id,
        name: op.name,
        soapAction: op.soapAction,
        inputMessage: JSON.stringify(op.inputFields),
        outputMessage: JSON.stringify(op.outputFields),
        templateXml: op.templateXml,
      })
      operations.push(operation)
    }

    return { project, operations }
  })
}
