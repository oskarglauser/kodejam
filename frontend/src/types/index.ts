export interface ProjectSettings {
  dev_url?: string
  canvas_color?: string
}

export interface Project {
  id: string
  name: string
  repo_path: string
  settings: string
  created_at: string
  updated_at: string
}

export interface Page {
  id: string
  project_id: string
  name: string
  canvas_snapshot: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type BuildStatus = 'pending' | 'planning' | 'approved' | 'building' | 'completed' | 'error'

export interface Build {
  id: string
  page_id: string
  status: BuildStatus
  plan: string | null
  selected_shapes: string | null
  result: string | null
  error: string | null
  created_at: string
  completed_at: string | null
}

export interface AIThread {
  id: string
  page_id: string
  shape_ids: string | null
  messages: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface CanvasHistory {
  id: string
  page_id: string
  snapshot: string
  description: string | null
  build_id: string | null
  created_at: string
}
