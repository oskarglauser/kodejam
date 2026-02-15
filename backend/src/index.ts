import express from 'express'
import path from 'path'
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

// Serve saved screenshot files from any repo's .kodejam/screenshots/ directory
app.get('/api/screenshots/:filename', (req, res) => {
  const { filename } = req.params
  const repoPath = req.query.repo as string
  if (!repoPath || !filename) {
    return res.status(400).json({ error: 'repo query param and filename are required' })
  }
  // Use path.resolve so non-absolute repo paths (e.g. URLs used as paths)
  // resolve relative to process.cwd() — matching where captureScreenshots saved them
  const filePath = path.resolve(repoPath, '.kodejam', 'screenshots', filename)
  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: 'Screenshot not found', path: filePath })
    }
  })
})

app.listen(PORT, () => {
  console.log(`Kodejam backend running on http://localhost:${PORT}`)
})
