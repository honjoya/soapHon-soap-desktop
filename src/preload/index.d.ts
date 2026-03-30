export interface SoapHonAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>
}

declare global {
  interface Window {
    soapHonAPI: SoapHonAPI
  }
}
