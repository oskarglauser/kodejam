const BASE = '/api'
const REQUEST_TIMEOUT_MS = 30_000

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      signal: options?.signal ?? controller.signal,
    })
    if (!res.ok) {
      const body = await res.text()
      let message = `API error ${res.status}: ${body}`
      try {
        const parsed = JSON.parse(body)
        if (parsed.error) message = parsed.error
      } catch {}
      throw new Error(message)
    }
    return res.json()
  } finally {
    clearTimeout(timeout)
  }
}

// Projects
export const api = {
  // Projects
  listProjects: () => request<import('../types').Project[]>('/projects'),
  createProject: (data: { name: string; repo_path: string; dev_url?: string }) =>
    request<import('../types').Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getProject: (id: string) => request<import('../types').Project>(`/projects/${id}`),
  updateProject: (id: string, data: { name?: string; repo_path?: string; settings?: import('../types').ProjectSettings }) =>
    request<import('../types').Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
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

  // Scan views
  scanViews: (projectId: string) =>
    request<{ views: Array<{ name: string; path: string }> }>(`/projects/${projectId}/scan-views`, {
      method: 'POST',
    }),
}
