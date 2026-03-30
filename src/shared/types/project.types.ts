export interface Project {
  id: string
  name: string
  wsdlUrl: string
  serviceUrl: string
  wsdlRaw: string | null
  createdAt: string
  updatedAt: string
}

export interface Operation {
  id: string
  projectId: string
  name: string
  soapAction: string | null
  inputMessage: string | null
  outputMessage: string | null
  templateXml: string | null
  createdAt: string
}
