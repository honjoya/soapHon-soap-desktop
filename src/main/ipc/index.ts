import { registerWsdlHandlers } from './wsdl.ipc'
import { registerProjectHandlers } from './project.ipc'
import { registerRequestHandlers } from './request.ipc'
import { registerSoapHandlers } from './soap.ipc'

export function registerAllHandlers() {
  registerWsdlHandlers()
  registerProjectHandlers()
  registerRequestHandlers()
  registerSoapHandlers()
}
