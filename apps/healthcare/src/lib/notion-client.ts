import { endpoints } from './api-endpoints'
import { httpJson } from './http'

export const notionBridge = {
  health: () => httpJson<{ status: string; service: string }>(`${endpoints.notion}/health`),

  listDatabases: () => httpJson<any>(`${endpoints.notion}/api/notion/databases`),

  discoverDatabases: () => httpJson<any>(`${endpoints.notion}/api/notion/databases/discover`),

  queryDatabase: (payload: { databaseId: string; filter?: any; sorts?: any; pageSize?: number }) =>
    httpJson<any>(`${endpoints.notion}/api/notion/query`, { method: 'POST', body: payload }),

  createPage: (payload: { databaseId: string; properties: Record<string, any>; children?: any[] }) =>
    httpJson<any>(`${endpoints.notion}/api/notion/page/create`, { method: 'POST', body: payload }),

  updatePage: (payload: { pageId: string; properties: Record<string, any> }) =>
    httpJson<any>(`${endpoints.notion}/api/notion/page/update`, { method: 'POST', body: payload }),

  setStatus: (payload: { pageId: string; statusProperty?: string; statusValue: string }) =>
    httpJson<any>(`${endpoints.notion}/api/notion/page/set-status`, { method: 'POST', body: payload }),
}
