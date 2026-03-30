export const IPC_CHANNELS = {
  WSDL_IMPORT: 'wsdl:import',
  PROJECT_LIST: 'project:list',
  PROJECT_DELETE: 'project:delete',
  PROJECT_UPDATE_URL: 'project:update-url',
  PROJECT_RENAME: 'project:rename',
  OPERATION_LIST: 'operation:list',
  REQUEST_SAVE: 'request:save',
  REQUEST_LIST: 'request:list',
  REQUEST_DELETE: 'request:delete',
  SOAP_SEND: 'soap:send',
} as const
