import express from 'express'
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
const PORT = 3001

app.use(cors())
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
  const rawPath = (req.query.path as string) || homedir()
  const dirPath = path.resolve(rawPath)

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

app.listen(PORT, () => {
  console.log(`Kodejam backend running on http://localhost:${PORT}`)
})
