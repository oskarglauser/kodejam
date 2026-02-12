import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { getDb } from '../db.js'

export const historyRouter = Router()

// List history for a page
historyRouter.get('/pages/:pageId/history', (_req, res) => {
  const db = getDb()
  const entries = db
    .prepare('SELECT * FROM canvas_history WHERE page_id = ? ORDER BY created_at DESC')
    .all(_req.params.pageId)
  res.json(entries)
})

// Create history entry
historyRouter.post('/pages/:pageId/history', (req, res) => {
  const db = getDb()
  const { snapshot, description, build_id } = req.body
  if (!snapshot) return res.status(400).json({ error: 'snapshot is required' })

  const id = uuid()
  db.prepare(
    'INSERT INTO canvas_history (id, page_id, snapshot, description, build_id) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.params.pageId, snapshot, description ?? null, build_id ?? null)

  const entry = db.prepare('SELECT * FROM canvas_history WHERE id = ?').get(id)
  res.status(201).json(entry)
})

// Get single history entry
historyRouter.get('/history/:id', (req, res) => {
  const db = getDb()
  const entry = db.prepare('SELECT * FROM canvas_history WHERE id = ?').get(req.params.id)
  if (!entry) return res.status(404).json({ error: 'History entry not found' })
  res.json(entry)
})
