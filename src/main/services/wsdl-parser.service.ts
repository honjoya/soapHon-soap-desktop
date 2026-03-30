import axios from 'axios'
import https from 'https'
import { XMLParser } from 'fast-xml-parser'
import type { ParsedWsdl, ParsedOperation, WsdlField } from '@shared/types/wsdl.types'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  isArray: (name) => {
    const arrayTags = ['operation', 'part', 'element', 'complexType', 'sequence', 'message', 'port', 'binding', 'portType', 'service', 'import']
    const localName = name.includes(':') ? name.split(':').pop()! : name
    return arrayTags.includes(localName)
  },
})

export async function parseWsdl(url: string): Promise<ParsedWsdl> {
  const response = await axios.get(url, { timeout: 30000, httpsAgent })
  const rawXml = response.data as string
  const parsed = parser.parse(rawXml)

  const root = findRoot(parsed)
  if (!root) {
    throw new Error('Invalid WSDL: could not find definitions or description root element')
  }

  const serviceName = extractServiceName(root)
  const endpointUrl = extractEndpointUrl(root) || url.replace(/\?wsdl$/i, '')
  const operations = extractOperations(root)

  return { serviceName, endpointUrl, operations, rawXml }
}

function findRoot(parsed: any): any {
  for (const key of Object.keys(parsed)) {
    const localName = key.includes(':') ? key.split(':').pop() : key
    if (localName === 'definitions' || localName === 'description') {
      return parsed[key]
    }
  }
  return null
}

function extractServiceName(root: any): string {
  const service = findByLocalName(root, 'service')
  if (service) {
    const svc = Array.isArray(service) ? service[0] : service
    return svc['@_name'] || 'Unknown Service'
  }
  return root['@_name'] || 'Unknown Service'
}

function extractEndpointUrl(root: any): string | null {
  const service = findByLocalName(root, 'service')
  if (!service) return null

  const svc = Array.isArray(service) ? service[0] : service
  const port = findByLocalName(svc, 'port')
  if (!port) return null

  const p = Array.isArray(port) ? port[0] : port
  for (const key of Object.keys(p)) {
    const localName = key.includes(':') ? key.split(':').pop() : key
    if (localName === 'address') {
      const addr = p[key]
      return addr?.['@_location'] || null
    }
  }
  return null
}

function extractOperations(root: any): ParsedOperation[] {
  const operations: ParsedOperation[] = []

  const portType = findByLocalName(root, 'portType')
  const binding = findByLocalName(root, 'binding')
  const messages = findByLocalName(root, 'message')

  if (!portType) return operations

  const pt = Array.isArray(portType) ? portType[0] : portType
  const ops = findByLocalName(pt, 'operation')
  if (!ops) return operations

  const opList = Array.isArray(ops) ? ops : [ops]
  const bindingOps = getBindingOperations(binding)
  const messageMap = buildMessageMap(messages)

  for (const op of opList) {
    const name = op['@_name']
    if (!name) continue

    const soapAction = bindingOps[name] || null

    const inputMsg = getMessageRef(op, 'input')
    const outputMsg = getMessageRef(op, 'output')

    const inputFields = resolveMessageFields(inputMsg, messageMap, root)
    const outputFields = resolveMessageFields(outputMsg, messageMap, root)

    const templateXml = generateTemplate(name, soapAction, inputFields, extractTargetNamespace(root))

    operations.push({
      name,
      soapAction,
      inputFields,
      outputFields,
      templateXml,
    })
  }

  return operations
}

function getBindingOperations(binding: any): Record<string, string> {
  const map: Record<string, string> = {}
  if (!binding) return map

  const b = Array.isArray(binding) ? binding[0] : binding
  const ops = findByLocalName(b, 'operation')
  if (!ops) return map

  const opList = Array.isArray(ops) ? ops : [ops]
  for (const op of opList) {
    const name = op['@_name']
    if (!name) continue

    for (const key of Object.keys(op)) {
      const localName = key.includes(':') ? key.split(':').pop() : key
      if (localName === 'operation') {
        const soapOp = op[key]
        const action = Array.isArray(soapOp) ? soapOp[0]?.['@_soapAction'] : soapOp?.['@_soapAction']
        if (action) map[name] = action
      }
    }
  }
  return map
}

function buildMessageMap(messages: any): Record<string, any> {
  const map: Record<string, any> = {}
  if (!messages) return map

  const msgList = Array.isArray(messages) ? messages : [messages]
  for (const msg of msgList) {
    const name = msg['@_name']
    if (name) map[name] = msg
  }
  return map
}

function getMessageRef(op: any, direction: 'input' | 'output'): string | null {
  const el = findByLocalName(op, direction)
  if (!el) return null
  const e = Array.isArray(el) ? el[0] : el
  const msgAttr = e['@_message'] || ''
  return msgAttr.includes(':') ? msgAttr.split(':').pop()! : msgAttr
}

function resolveMessageFields(msgName: string | null, messageMap: Record<string, any>, root: any): WsdlField[] {
  if (!msgName || !messageMap[msgName]) return []

  const msg = messageMap[msgName]
  const parts = findByLocalName(msg, 'part')
  if (!parts) return []

  const partList = Array.isArray(parts) ? parts : [parts]
  const fields: WsdlField[] = []

  for (const part of partList) {
    const name = part['@_name'] || 'param'
    const typeAttr = part['@_type'] || part['@_element'] || 'string'
    const typeName = typeAttr.includes(':') ? typeAttr.split(':').pop()! : typeAttr

    const schemaFields = resolveSchemaType(typeName, root)
    if (schemaFields.length > 0) {
      fields.push(...schemaFields)
    } else {
      fields.push({ name, type: typeName, required: true })
    }
  }

  return fields
}

function resolveSchemaType(typeName: string, root: any): WsdlField[] {
  const types = findByLocalName(root, 'types')
  if (!types) return []

  const schema = findByLocalName(types, 'schema')
  if (!schema) return []

  const schemaNode = Array.isArray(schema) ? schema[0] : schema

  const elements = findByLocalName(schemaNode, 'element')
  if (elements) {
    const elList = Array.isArray(elements) ? elements : [elements]
    for (const el of elList) {
      if (el['@_name'] === typeName) {
        return extractFieldsFromElement(el, schemaNode)
      }
    }
  }

  const complexTypes = findByLocalName(schemaNode, 'complexType')
  if (complexTypes) {
    const ctList = Array.isArray(complexTypes) ? complexTypes : [complexTypes]
    for (const ct of ctList) {
      if (ct['@_name'] === typeName) {
        return extractFieldsFromComplexType(ct)
      }
    }
  }

  return []
}

function extractFieldsFromElement(el: any, schema: any): WsdlField[] {
  const ct = findByLocalName(el, 'complexType')
  if (ct) {
    const ctNode = Array.isArray(ct) ? ct[0] : ct
    return extractFieldsFromComplexType(ctNode)
  }
  return []
}

function extractFieldsFromComplexType(ct: any): WsdlField[] {
  const seq = findByLocalName(ct, 'sequence') || findByLocalName(ct, 'all')
  if (!seq) return []

  const seqNode = Array.isArray(seq) ? seq[0] : seq
  const elements = findByLocalName(seqNode, 'element')
  if (!elements) return []

  const elList = Array.isArray(elements) ? elements : [elements]
  return elList.map((el: any) => ({
    name: el['@_name'] || 'field',
    type: (el['@_type'] || 'string').replace(/.*:/, ''),
    required: el['@_minOccurs'] !== '0',
  }))
}

function extractTargetNamespace(root: any): string {
  return root['@_targetNamespace'] || 'http://tempuri.org/'
}

function findByLocalName(obj: any, localName: string): any {
  if (!obj || typeof obj !== 'object') return null
  for (const key of Object.keys(obj)) {
    const ln = key.includes(':') ? key.split(':').pop() : key
    if (ln === localName) return obj[key]
  }
  return null
}

function generateTemplate(
  operationName: string,
  soapAction: string | null,
  inputFields: WsdlField[],
  targetNamespace: string
): string {
  const fieldsXml = inputFields
    .map((f) => `      <${f.name}>?</${f.name}>`)
    .join('\n')

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="${targetNamespace}">
  <soap:Header/>
  <soap:Body>
    <tns:${operationName}>
${fieldsXml}
    </tns:${operationName}>
  </soap:Body>
</soap:Envelope>`
}
