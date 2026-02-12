import { Router, Request, Response } from 'express'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { v4 as uuid } from 'uuid'
import { getDb } from '../db.js'

export const chatRouter = Router()

interface ShapeContext {
  id: string
  type: string
  label: string
  description?: string
}

interface ChatRequest {
  threadId?: string
  message: string
  context: {
    shapes: ShapeContext[]
    repoPath: string
    pageName: string
  }
}

function buildSystemPrompt(shapes: ShapeContext[], pageName: string): string {
  const shapeDescriptions = shapes
    .map((s) => {
      const desc = s.description ? ` - ${s.description}` : ''
      return `  - [${s.type}] "${s.label}"${desc} (id: ${s.id})`
    })
    .join('\n')

  return [
    `You are an AI assistant helping design and build a web application.`,
    `The user is working on a canvas page called "${pageName}".`,
    '',
    shapes.length > 0
      ? `The canvas currently contains these shapes/components:\n${shapeDescriptions}`
      : `The canvas is currently empty.`,
    '',
    `You have read-only access to the project codebase. You can read files, search for patterns, and explore the directory structure to answer questions about the code.`,
    '',
    `When discussing code, reference specific file paths and line numbers when possible.`,
    `Keep responses concise and focused on what the user asked.`,
  ].join('\n')
}

function findClaudeBinary(): string {
  // Prefer the globally installed binary, fall back to npx
  return 'claude'
}

function spawnClaude(
  prompt: string,
  allowedTools: string,
  cwd: string
): ChildProcessWithoutNullStreams {
  const bin = findClaudeBinary()
  const args = [
    '-p',
    prompt,
    '--output-format',
    'stream-json',
    '--allowedTools',
    allowedTools,
  ]

  return spawn(bin, args, {
    cwd,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

// POST / - SSE streaming chat endpoint
chatRouter.post('/', (req: Request, res: Response) => {
  const { threadId, message, context } = req.body as ChatRequest

  if (!message || !context?.repoPath) {
    return res.status(400).json({ error: 'message and context.repoPath are required' })
  }

  const db = getDb()
  const currentThreadId = threadId || uuid()
  const isNewThread = !threadId

  // Load existing messages if resuming a thread
  let existingMessages: Array<{ role: string; content: string }> = []
  if (!isNewThread) {
    const thread = db.prepare('SELECT * FROM ai_threads WHERE id = ?').get(currentThreadId) as
      | { messages: string }
      | undefined
    if (thread) {
      try {
        existingMessages = JSON.parse(thread.messages)
      } catch {
        existingMessages = []
      }
    }
  }

  // Build the full prompt with system context and conversation history
  const systemPrompt = buildSystemPrompt(context.shapes || [], context.pageName || 'Untitled')

  let fullPrompt = systemPrompt + '\n\n'
  if (existingMessages.length > 0) {
    fullPrompt += 'Previous conversation:\n'
    for (const msg of existingMessages) {
      const prefix = msg.role === 'user' ? 'User' : 'Assistant'
      fullPrompt += `${prefix}: ${msg.content}\n\n`
    }
  }
  fullPrompt += `User: ${message}`

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  // Send the thread ID immediately so the client can track it
  res.write(`data: ${JSON.stringify({ type: 'thread', threadId: currentThreadId })}\n\n`)

  const child = spawnClaude(fullPrompt, 'Read,Glob,Grep', context.repoPath)

  let assistantResponse = ''
  let buffer = ''

  child.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString()

    // Process complete lines
    const lines = buffer.split('\n')
    buffer = lines.pop() || '' // Keep incomplete last line in buffer

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      try {
        const parsed = JSON.parse(trimmed)

        // Accumulate assistant text from the streaming response
        if (parsed.type === 'assistant' && parsed.message?.content) {
          for (const block of parsed.message.content) {
            if (block.type === 'text') {
              assistantResponse += block.text
            }
          }
        }

        // Forward the event to the client
        res.write(`data: ${JSON.stringify(parsed)}\n\n`)
      } catch {
        // Not valid JSON, skip
      }
    }
  })

  child.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString().trim()
    if (text) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: text })}\n\n`)
    }
  })

  child.on('close', (code) => {
    // Save conversation to database
    const updatedMessages = [
      ...existingMessages,
      { role: 'user', content: message },
      ...(assistantResponse ? [{ role: 'assistant', content: assistantResponse }] : []),
    ]

    const shapeIds = (context.shapes || []).map((s) => s.id)

    if (isNewThread) {
      db.prepare(
        `INSERT INTO ai_threads (id, page_id, shape_ids, messages) VALUES (?, ?, ?, ?)`
      ).run(
        currentThreadId,
        context.pageName || '',
        JSON.stringify(shapeIds),
        JSON.stringify(updatedMessages)
      )
    } else {
      db.prepare(
        `UPDATE ai_threads SET messages = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(JSON.stringify(updatedMessages), currentThreadId)
    }

    res.write(
      `data: ${JSON.stringify({ type: 'done', threadId: currentThreadId, exitCode: code })}\n\n`
    )
    res.end()
  })

  child.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`)
    res.end()
  })

  // Handle client disconnect
  req.on('close', () => {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  })
})
