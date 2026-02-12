import { create } from 'zustand'
import type { Project, Page } from '../types'
import { api } from '../services/api'

interface ProjectStore {
  projects: Project[]
  currentProject: Project | null
  pages: Page[]
  currentPage: Page | null
  loading: boolean

  loadProjects: () => Promise<void>
  createProject: (name: string, repoPath: string) => Promise<Project>
  setCurrentProject: (project: Project) => void
  deleteProject: (id: string) => Promise<void>

  loadPages: (projectId: string) => Promise<void>
  createPage: (name: string) => Promise<Page>
  setCurrentPage: (page: Page | null) => void
  updatePage: (pageId: string, data: Partial<{ name: string; canvas_snapshot: string }>) => Promise<void>
  deletePage: (pageId: string) => Promise<void>
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  pages: [],
  currentPage: null,
  loading: false,

  loadProjects: async () => {
    set({ loading: true })
    const projects = await api.listProjects()
    set({ projects, loading: false })
  },

  createProject: async (name, repoPath) => {
    const project = await api.createProject({ name, repo_path: repoPath })
    set((s) => ({ projects: [...s.projects, project] }))
    return project
  },

  setCurrentProject: (project) => {
    set({ currentProject: project, pages: [], currentPage: null })
  },

  deleteProject: async (id) => {
    await api.deleteProject(id)
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProject: s.currentProject?.id === id ? null : s.currentProject,
    }))
  },

  loadPages: async (projectId) => {
    const pages = await api.listPages(projectId)
    set({ pages })
    if (pages.length > 0 && !get().currentPage) {
      set({ currentPage: pages[0] })
    }
  },

  createPage: async (name) => {
    const project = get().currentProject
    if (!project) throw new Error('No project selected')
    const page = await api.createPage(project.id, { name })
    set((s) => ({ pages: [...s.pages, page] }))
    return page
  },

  setCurrentPage: (page) => set({ currentPage: page }),

  updatePage: async (pageId, data) => {
    await api.updatePage(pageId, data)
    set((s) => ({
      pages: s.pages.map((p) => (p.id === pageId ? { ...p, ...data, updated_at: new Date().toISOString() } : p)),
      currentPage: s.currentPage?.id === pageId ? { ...s.currentPage, ...data, updated_at: new Date().toISOString() } : s.currentPage,
    }))
  },

  deletePage: async (pageId) => {
    await api.deletePage(pageId)
    set((s) => {
      const pages = s.pages.filter((p) => p.id !== pageId)
      return {
        pages,
        currentPage: s.currentPage?.id === pageId ? (pages[0] ?? null) : s.currentPage,
      }
    })
  },
}))
