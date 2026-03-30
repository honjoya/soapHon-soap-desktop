import { create } from 'zustand'
import type { Project, Operation } from '../../shared/types/project.types'
import type { SavedRequest, SoapResponse, HeaderEntry, AuthConfig } from '../../shared/types/request.types'

interface AppState {
  projects: Project[]
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  removeProject: (id: string) => void
  updateProject: (id: string, data: Partial<Project>) => void

  activeProjectId: string | null
  setActiveProjectId: (id: string | null) => void

  operations: Operation[]
  setOperations: (ops: Operation[]) => void

  activeOperationId: string | null
  setActiveOperationId: (id: string | null) => void

  savedRequests: SavedRequest[]
  setSavedRequests: (reqs: SavedRequest[]) => void

  activeRequestId: string | null
  setActiveRequestId: (id: string | null) => void

  endpointUrl: string
  setEndpointUrl: (url: string) => void

  requestXml: string
  setRequestXml: (xml: string) => void

  headers: HeaderEntry[]
  setHeaders: (headers: HeaderEntry[]) => void

  auth: AuthConfig
  setAuth: (auth: AuthConfig) => void

  response: SoapResponse | null
  setResponse: (res: SoapResponse | null) => void

  loading: boolean
  setLoading: (loading: boolean) => void

  sidebarWidth: number
  setSidebarWidth: (w: number) => void
}

export const useStore = create<AppState>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((s) => ({ projects: [project, ...s.projects] })),
  removeProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
  updateProject: (id, data) => set((s) => ({
    projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
  })),

  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),

  operations: [],
  setOperations: (ops) => set({ operations: ops }),

  activeOperationId: null,
  setActiveOperationId: (id) => set({ activeOperationId: id }),

  savedRequests: [],
  setSavedRequests: (reqs) => set({ savedRequests: reqs }),

  activeRequestId: null,
  setActiveRequestId: (id) => set({ activeRequestId: id }),

  endpointUrl: '',
  setEndpointUrl: (url) => set({ endpointUrl: url }),

  requestXml: '',
  setRequestXml: (xml) => set({ requestXml: xml }),

  headers: [],
  setHeaders: (headers) => set({ headers }),

  auth: { type: 'none' },
  setAuth: (auth) => set({ auth }),

  response: null,
  setResponse: (res) => set({ response: res }),

  loading: false,
  setLoading: (loading) => set({ loading }),

  sidebarWidth: 280,
  setSidebarWidth: (w) => set({ sidebarWidth: w }),
}))
