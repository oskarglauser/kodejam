// Environment variables:
//   PORT          - Server port (default: 3001)
//   CORS_ORIGIN   - Allowed CORS origin (default: http://localhost:5173)
//   CLAUDE_BINARY - Path to claude CLI binary (default: looks up 'claude' in PATH)
//   BROWSE_ROOT   - Optional root directory for the browse endpoint (default: user home)

import express, { type Request, type Response, type NextFunction } from 'express'
import path from 'path'
import { readdirSync, statSync } from 'fs'
import { homedir } from 'os'
import cors from 'cors'
import { runMigrations } from './db.js'
import { projectsRouter, pagesRouter } from './routes/projects.js'
import { historyRouter } from './routes/history.js'
import { chatRouter } from './routes/chat.js'
import { buildRouter } from './routes/build.js'
import { screenshotRouter } from './routes/screenshot.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '50mb' }))

// Run migrations on startup
runMigrations()

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Routes
app.use('/api/projects', projectsRouter)
app.use('/api/pages', pagesRouter)
app.use('/api', historyRouter)
app.use('/api/chat', chatRouter)
app.use('/api/build', buildRouter)
app.use('/api/screenshot', screenshotRouter)

// Browse local directories for project path picker
app.get('/api/browse', (req, res) => {
  const browseRoot = process.env.BROWSE_ROOT || homedir()
  const rawPath = (req.query.path as string) || browseRoot
  const dirPath = path.resolve(rawPath)

  // Ensure the resolved path is within the allowed root
  const resolvedRoot = path.resolve(browseRoot)
  if (!dirPath.startsWith(resolvedRoot) && dirPath !== resolvedRoot) {
    return res.status(403).json({ error: 'Path is outside the allowed directory' })
  }

  try {
    const stat = statSync(dirPath)
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Not a directory' })
    }
  } catch {
    return res.status(400).json({ error: 'Cannot access path' })
  }

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true })
    const dirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

    res.json({ path: dirPath, dirs })
  } catch {
    res.status(403).json({ error: 'Permission denied' })
  }
})

// Serve saved screenshot files from any repo's .kodejam/screenshots/ directory
app.get('/api/screenshots/:filename', (req, res) => {
  const { filename } = req.params
  const repoPath = req.query.repo as string
  if (!repoPath || !filename) {
    return res.status(400).json({ error: 'repo query param and filename are required' })
  }
  // Prevent path traversal — filename must be a bare screenshot file, no path separators
  if (filename.includes('/') || filename.includes('\\') || filename !== path.basename(filename)) {
    return res.status(400).json({ error: 'Invalid filename' })
  }
  const filePath = path.resolve(repoPath, '.kodejam', 'screenshots', filename)
  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: 'Screenshot not found' })
    }
  })
})

// Global error handler — catch unhandled errors without leaking stack traces
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[server] Unhandled error:', err.message)
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`Kodejam backend running on http://localhost:${PORT}`)
})
