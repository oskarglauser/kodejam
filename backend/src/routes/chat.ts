import { Router, Request, Response } from 'express'
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import { v4 as uuid } from 'uuid'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { chromium } from 'playwright'
import { getDb } from '../db.js'

export const chatRouter = Router()

interface ShapeContext {
  id: string
  type: string
  label: string
  description?: string
  imageUrl?: string
}

interface ChatRequest {
  threadId?: string
  message: string
  context: {
    shapes: ShapeContext[]
    repoPath: string
    pageName: string
    pageId?: string
    devUrl?: string
  }
}

interface ScreenshotCommand {
  urls: string[]
  descriptions?: string[]
}

function buildSystemPrompt(shapes: ShapeContext[], pageName: string, devUrl?: string): string {
  const shapeDescriptions = shapes
    .map((s) => {
      const desc = s.description ? ` - ${s.description}` : ''
      return `  - [${s.type}] "${s.label}"${desc} (id: ${s.id})`
    })
    .join('\n')

  const lines = [
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
  ]

  if (devUrl) {
    lines.push(
      '',
      `SCREENSHOT CAPABILITY:`,
      `The user's app dev server is running at: ${devUrl}`,
      `When the user asks to see a page, view, screen, flow, or UI of their app, you should:`,
      `1. Read the codebase to find the relevant routes/paths`,
      `2. Output a screenshot command as a special JSON block on its own line:`,
      `   [SCREENSHOT:{"urls":["${devUrl}/path1","${devUrl}/path2"],"descriptions":["Description of page 1","Description of page 2"]}]`,
      `3. The URLs must be full URLs starting with the dev server base URL above`,
      `4. Include a brief description for each URL`,
      `5. After the screenshot command, briefly explain what you found in the codebase about these views`,
      ``,
      `Example: If the user says "show me the login page" and you find a /login route:`,
      `[SCREENSHOT:{"urls":["${devUrl}/login"],"descriptions":["Login page"]}]`,
    )
  }

  return lines.join('\n')
}

function findClaudeBinary(): string {
  return process.env.CLAUDE_BINARY || 'claude'
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
    '--verbose',
    '--allowedTools',
    allowedTools,
    '--dangerously-skip-permissions',
    '--max-turns',
    '10',
  ]

  // Ensure cwd exists
  if (!existsSync(cwd)) {
    mkdirSync(cwd, { recursive: true })
  }

  const escapedArgs = args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(' ')
  const cmd = `${bin} ${escapedArgs} < /dev/null`

  return spawn('bash', ['-c', cmd], {
    cwd,
    env: { ...process.env, CLAUDECODE: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function parseScreenshotCommands(text: string): ScreenshotCommand[] {
  const commands: ScreenshotCommand[] = []
  const marker = '[SCREENSHOT:'

  let searchFrom = 0
  while (true) {
    const idx = text.indexOf(marker, searchFrom)
    if (idx === -1) break

    const jsonStart = idx + marker.length

    // Find the JSON object by tracking brace/bracket depth
    let depth = 0
    let jsonEnd = -1
    for (let i = jsonStart; i < text.length; i++) {
      const ch = text[i]
      if (ch === '{' || ch === '[') depth++
      if (ch === '}' || ch === ']') depth--
      if (depth === 0 && ch === '}') {
        jsonEnd = i + 1
        break
      }
    }

    if (jsonEnd === -1) break

    try {
      const jsonStr = text.slice(jsonStart, jsonEnd)
      const parsed = JSON.parse(jsonStr)
      if (parsed.urls && Array.isArray(parsed.urls) && parsed.urls.length > 0) {
        commands.push({
          urls: parsed.urls,
          descriptions: parsed.descriptions,
        })
      }
    } catch {
      // Invalid JSON in screenshot command, skip
    }

    searchFrom = jsonEnd
  }

  return commands
}

async function captureScreenshots(
  commands: ScreenshotCommand[],
  repoPath: string
): Promise<Array<{ url: string; description: string; imageUrl: string; width: number; height: number; filePath: string }>> {
  const results: Array<{ url: string; description: string; imageUrl: string; width: number; height: number; filePath: string }> = []

  // Ensure screenshots directory exists
  const screenshotsDir = path.join(repoPath, '.kodejam', 'screenshots')
  if (!existsSync(screenshotsDir)) {
    mkdirSync(screenshotsDir, { recursive: true })
  }

  let browser
  try {
    browser = await chromium.launch({ headless: true })

    for (const cmd of commands) {
      for (let i = 0; i < cmd.urls.length; i++) {
        const url = cmd.urls[i]
        const description = cmd.descriptions?.[i] || url

        const page = await browser.newPage({
          viewport: { width: 1280, height: 800 },
        })
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
          await page.waitForTimeout(1000)

          const screenshotBuffer = await page.screenshot({ fullPage: false }) as Buffer

          // Save to disk and serve via HTTP URL
          const filename = `screenshot-${Date.now()}-${i}.png`
          const filePath = path.join(screenshotsDir, filename)
          writeFileSync(filePath, screenshotBuffer)

          const imageUrl = `/api/screenshots/${filename}?repo=${encodeURIComponent(repoPath)}`

          results.push({
            url,
            description,
            imageUrl,
            width: 1280,
            height: 800,
            filePath,
          })
        } catch (err: any) {
          console.error(`[chat] Screenshot failed for ${url}:`, err.message)
        } finally {
          await page.close()
        }
      }
    }
  } catch (err: any) {
    console.error('[chat] Browser launch failed:', err.message)
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  return results
}

// GET /threads - Load the most recent thread for a page
chatRouter.get('/threads', (req: Request, res: Response) => {
  const pageId = req.query.pageId as string
  if (!pageId) {
    return res.status(400).json({ error: 'pageId query param is required' })
  }
  const db = getDb()
  const thread = db.prepare(
    'SELECT * FROM ai_threads WHERE page_id = ? ORDER BY updated_at DESC LIMIT 1'
  ).get(pageId)
  if (!thread) {
    return res.json(null)
  }
  res.json(thread)
})

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
  const systemPrompt = buildSystemPrompt(
    context.shapes || [],
    context.pageName || 'Untitled',
    context.devUrl
  )

  // Build prompt for screenshot shapes that have imageUrl (annotation flow)
  let screenshotContext = ''
  const screenshotShapes = (context.shapes || []).filter(
    (s) => s.type === 'screenshot' && s.imageUrl
  )
  if (screenshotShapes.length > 0) {
    screenshotContext = '\n\nThe following screenshots from the app are on the canvas. The user may have added annotations (arrows, sticky notes, drawings) over them:\n'
    for (const shape of screenshotShapes) {
      screenshotContext += `  - Screenshot "${shape.label || shape.description || 'Untitled'}": image available at ${shape.imageUrl}\n`
    }
    screenshotContext += 'If the user references these screenshots or asks you to fix issues shown in them, use the Read tool to view the screenshot images and understand the visual context.\n'
  }

  let fullPrompt = systemPrompt + screenshotContext + '\n\n'
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

  console.log('[chat] Child spawned, pid:', child.pid)

  let assistantResponse = ''
  let buffer = ''
  let clientDisconnected = false

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

        // Accumulate text from content_block_delta events
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta' && parsed.delta.text) {
          assistantResponse += parsed.delta.text
        }

        // Capture full text from result event (final response)
        if (parsed.type === 'result' && parsed.result) {
          // Reset and use the complete result text if available
          const resultText = typeof parsed.result === 'string'
            ? parsed.result
            : Array.isArray(parsed.result?.content)
              ? parsed.result.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
              : ''
          if (resultText) {
            assistantResponse = resultText
          }
        }

        // Forward the event to the client
        if (!clientDisconnected) {
          res.write(`data: ${JSON.stringify(parsed)}\n\n`)
        }
      } catch {
        // Not valid JSON, skip
      }
    }
  })

  child.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString().trim()
    if (text && !clientDisconnected) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: text })}\n\n`)
    }
  })

  child.on('close', async (code, signal) => {
    console.log('[chat] Child closed, code:', code, 'signal:', signal)
    console.log('[chat] assistantResponse length:', assistantResponse.length)
    console.log('[chat] assistantResponse preview:', assistantResponse.slice(0, 500))

    // Check for screenshot commands in the response
    const screenshotCommands = parseScreenshotCommands(assistantResponse)
    console.log('[chat] Screenshot commands found:', screenshotCommands.length, JSON.stringify(screenshotCommands))

    if (screenshotCommands.length > 0 && !clientDisconnected) {
      console.log('[chat] Found screenshot commands, capturing...')
      res.write(`data: ${JSON.stringify({ type: 'screenshot_status', status: 'capturing' })}\n\n`)

      try {
        const screenshots = await captureScreenshots(screenshotCommands, context.repoPath)

        for (const screenshot of screenshots) {
          res.write(`data: ${JSON.stringify({
            type: 'screenshot',
            url: screenshot.url,
            description: screenshot.description,
            imageUrl: screenshot.imageUrl,
            width: screenshot.width,
            height: screenshot.height,
            filePath: screenshot.filePath,
          })}\n\n`)
        }
      } catch (err: any) {
        console.error('[chat] Screenshot capture error:', err.message)
        res.write(`data: ${JSON.stringify({ type: 'error', error: `Screenshot capture failed: ${err.message}` })}\n\n`)
      }
    }

    // Save conversation to database
    const updatedMessages = [
      ...existingMessages,
      { role: 'user', content: message },
      ...(assistantResponse ? [{ role: 'assistant', content: assistantResponse }] : []),
    ]

    const shapeIds = (context.shapes || []).map((s) => s.id)

    if (isNewThread && context.pageId) {
      try {
        db.prepare(
          `INSERT INTO ai_threads (id, page_id, shape_ids, messages) VALUES (?, ?, ?, ?)`
        ).run(
          currentThreadId,
          context.pageId,
          JSON.stringify(shapeIds),
          JSON.stringify(updatedMessages)
        )
      } catch (e) {
        // Non-fatal: thread storage failed but response was already sent
      }
    } else if (!isNewThread) {
      db.prepare(
        `UPDATE ai_threads SET messages = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(JSON.stringify(updatedMessages), currentThreadId)
    }

    if (!clientDisconnected) {
      res.write(
        `data: ${JSON.stringify({ type: 'done', threadId: currentThreadId, exitCode: code })}\n\n`
      )
      res.end()
    }
  })

  child.on('error', (err) => {
    if (!clientDisconnected) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`)
      res.end()
    }
  })

  // Handle client disconnect - use res.on('close') not req.on('close')
  res.on('close', () => {
    console.log('[chat] Response connection closed')
    clientDisconnected = true
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  })
})
