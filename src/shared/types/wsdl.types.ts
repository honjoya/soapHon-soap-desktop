export interface WsdlField {
  name: string
  type: string
  required: boolean
}

export interface ParsedOperation {
  name: string
  soapAction: string | null
  inputFields: WsdlField[]
  outputFields: WsdlField[]
  templateXml: string
}

export interface ParsedWsdl {
  serviceName: string
  endpointUrl: string
  operations: ParsedOperation[]
  rawXml: string
}
