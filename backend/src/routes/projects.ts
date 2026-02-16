import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { spawn } from 'child_process'
import { existsSync, statSync } from 'fs'
import { getDb } from '../db.js'

export const projectsRouter = Router()
export const pagesRouter = Router()

// --- Projects ---

// List projects
projectsRouter.get('/', (_req, res) => {
  const db = getDb()
  const projects = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all()
  res.json(projects)
})

// Create project
projectsRouter.post('/', (req, res) => {
  const db = getDb()
  const { name, repo_path, dev_url } = req.body
  if (!name || !repo_path) {
    return res.status(400).json({ error: 'name and repo_path are required' })
  }

  // Validate repo_path is a local directory, not a URL
  const trimmedPath = repo_path.trim()
  if (/^(https?:\/\/|git@|ssh:\/\/|ftp:\/\/)/.test(trimmedPath) || trimmedPath.includes('://')) {
    return res.status(400).json({ error: 'repo_path must be a local directory path, not a URL' })
  }
  if (!trimmedPath.startsWith('/')) {
    return res.status(400).json({ error: 'repo_path must be an absolute path starting with /' })
  }
  if (!existsSync(trimmedPath)) {
    return res.status(400).json({ error: `repo_path does not exist: ${trimmedPath}` })
  }
  try {
    if (!statSync(trimmedPath).isDirectory()) {
      return res.status(400).json({ error: 'repo_path must be a directory, not a file' })
    }
  } catch {
    return res.status(400).json({ error: `Cannot access repo_path: ${trimmedPath}` })
  }

  const id = uuid()
  const settings = JSON.stringify({ dev_url: dev_url || '' })
  db.prepare('INSERT INTO projects (id, name, repo_path, settings) VALUES (?, ?, ?, ?)').run(id, name, trimmedPath, settings)
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  res.status(201).json(project)
})

// Get project
projectsRouter.get('/:id', (req, res) => {
  const db = getDb()
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!project) return res.status(404).json({ error: 'Project not found' })
  res.json(project)
})

// Update project
projectsRouter.patch('/:id', (req, res) => {
  const db = getDb()
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as
    | { id: string; settings: string }
    | undefined
  if (!project) return res.status(404).json({ error: 'Project not found' })

  const { name, repo_path, settings } = req.body

  const updates: string[] = []
  const values: unknown[] = []

  if (name !== undefined) {
    updates.push('name = ?')
    values.push(name)
  }
  if (repo_path !== undefined) {
    const trimmed = repo_path.trim()
    if (/^(https?:\/\/|git@|ssh:\/\/|ftp:\/\/)/.test(trimmed) || trimmed.includes('://')) {
      return res.status(400).json({ error: 'repo_path must be a local directory path, not a URL' })
    }
    if (!trimmed.startsWith('/')) {
      return res.status(400).json({ error: 'repo_path must be an absolute path starting with /' })
    }
    if (!existsSync(trimmed)) {
      return res.status(400).json({ error: `repo_path does not exist: ${trimmed}` })
    }
    try {
      if (!statSync(trimmed).isDirectory()) {
        return res.status(400).json({ error: 'repo_path must be a directory, not a file' })
      }
    } catch {
      return res.status(400).json({ error: `Cannot access repo_path: ${trimmed}` })
    }
    updates.push('repo_path = ?')
    values.push(trimmed)
  }
  if (settings !== undefined) {
    // Merge incoming settings with existing settings
    let existing: Record<string, unknown> = {}
    try { existing = JSON.parse(project.settings) } catch {}
    const merged = { ...existing, ...settings }
    updates.push('settings = ?')
    values.push(JSON.stringify(merged))
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')")
    values.push(req.params.id)
    db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  }

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  res.json(updated)
})

// Delete project
projectsRouter.delete('/:id', (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

// List pages for a project
projectsRouter.get('/:id/pages', (req, res) => {
  const db = getDb()
  const pages = db
    .prepare('SELECT * FROM pages WHERE project_id = ? ORDER BY sort_order, created_at')
    .all(req.params.id)
  res.json(pages)
})

// Create page
projectsRouter.post('/:id/pages', (req, res) => {
  const db = getDb()
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })

  const maxOrder = db
    .prepare('SELECT MAX(sort_order) as max_order FROM pages WHERE project_id = ?')
    .get(req.params.id) as { max_order: number | null }

  const id = uuid()
  const sortOrder = (maxOrder?.max_order ?? -1) + 1

  db.prepare('INSERT INTO pages (id, project_id, name, sort_order) VALUES (?, ?, ?, ?)').run(
    id,
    req.params.id,
    name,
    sortOrder
  )
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id)
  res.status(201).json(page)
})

// Scan views — use Claude Code CLI to identify routes/views in the codebase
projectsRouter.post('/:id/scan-views', (req, res) => {
  const db = getDb()
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as
    | { id: string; repo_path: string }
    | undefined
  if (!project) return res.status(404).json({ error: 'Project not found' })

  const cwd = project.repo_path
  if (!existsSync(cwd)) {
    return res.status(400).json({ error: 'Project repo_path does not exist' })
  }

  const prompt = `List all routes, views, pages, and major UI flows in this codebase. Return ONLY a valid JSON array of objects, each with "name" (short page name like "Home", "Login", "Dashboard") and "path" (the URL route path like "/", "/login", "/dashboard"). No explanation, no markdown, just the JSON array.`

  const bin = '/Users/oskarglauser/.local/bin/claude'
  const args = [
    '-p', prompt,
    '--output-format', 'text',
    '--allowedTools', 'Read,Glob,Grep',
    '--max-turns', '10',
  ]

  const escapedArgs = args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(' ')
  const cmd = `${bin} ${escapedArgs} < /dev/null`

  const child = spawn('bash', ['-c', cmd], {
    cwd,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let stdout = ''
  let stderr = ''

  child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
  child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

  child.on('close', (code) => {
    if (code !== 0) {
      console.error('[scan-views] Claude exited with code', code, stderr)
      return res.status(500).json({ error: 'Scan failed', details: stderr })
    }

    try {
      const jsonMatch = stdout.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON array found in response')
      const views = JSON.parse(jsonMatch[0])
      res.json({ views })
    } catch (err: any) {
      console.error('[scan-views] Failed to parse response:', stdout.slice(0, 500))
      res.status(500).json({ error: 'Failed to parse views', raw: stdout.slice(0, 1000) })
    }
  })

  child.on('error', (err) => {
    res.status(500).json({ error: err.message })
  })
})

// --- Pages (by page ID) ---

// Update page
pagesRouter.patch('/:pageId', (req, res) => {
  const db = getDb()
  const { name, canvas_snapshot } = req.body
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.pageId)
  if (!page) return res.status(404).json({ error: 'Page not found' })

  const updates: string[] = []
  const values: unknown[] = []

  if (name !== undefined) {
    updates.push('name = ?')
    values.push(name)
  }
  if (canvas_snapshot !== undefined) {
    updates.push('canvas_snapshot = ?')
    values.push(canvas_snapshot)
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')")
    values.push(req.params.pageId)
    db.prepare(`UPDATE pages SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  }

  const updated = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.pageId)
  res.json(updated)
})

// Delete page
pagesRouter.delete('/:pageId', (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM pages WHERE id = ?').run(req.params.pageId)
  res.status(204).end()
})
