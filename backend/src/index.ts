import express from 'express'
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
app.use('/api/builds', buildRouter)
app.use('/api/screenshot', screenshotRouter)

app.listen(PORT, () => {
  console.log(`Kodejam backend running on http://localhost:${PORT}`)
})
