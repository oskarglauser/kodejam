const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API error ${res.status}: ${body}`)
  }
  return res.json()
}

// Projects
export const api = {
  // Projects
  listProjects: () => request<import('../types').Project[]>('/projects'),
  createProject: (data: { name: string; repo_path: string }) =>
    request<import('../types').Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getProject: (id: string) => request<import('../types').Project>(`/projects/${id}`),
  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Pages
  listPages: (projectId: string) =>
    request<import('../types').Page[]>(`/projects/${projectId}/pages`),
  createPage: (projectId: string, data: { name: string }) =>
    request<import('../types').Page>(`/projects/${projectId}/pages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePage: (pageId: string, data: Partial<{ name: string; canvas_snapshot: string }>) =>
    request<import('../types').Page>(`/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deletePage: (pageId: string) =>
    request<void>(`/pages/${pageId}`, { method: 'DELETE' }),

  // Builds
  getBuild: (buildId: string) =>
    request<import('../types').Build>(`/build/${buildId}`),
  listBuilds: (pageId: string) =>
    request<import('../types').Build[]>(`/pages/${pageId}/builds`),

  // History
  listHistory: (pageId: string) =>
    request<import('../types').CanvasHistory[]>(`/pages/${pageId}/history`),
  createHistoryEntry: (pageId: string, data: { snapshot: string; description?: string }) =>
    request<import('../types').CanvasHistory>(`/pages/${pageId}/history`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Screenshot
  captureScreenshot: (data: { url: string; width?: number; height?: number; selector?: string }) =>
    request<{ imageBase64: string; dataUrl: string; width: number; height: number }>('/screenshot', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
