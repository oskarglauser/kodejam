import { Router, Request, Response } from 'express'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { v4 as uuid } from 'uuid'
import { existsSync, mkdirSync } from 'fs'
import { getDb } from '../db.js'
import type { Build } from '../types.js'

export const buildRouter = Router()

interface ShapeInfo {
  id: string
  type: string
  label: string
  description?: string
  connections?: Array<{ from: string; to: string; label?: string }>
}

interface PlanRequest {
  pageId: string
  shapes: ShapeInfo[]
  repoPath: string
}

interface ExecuteRequest {
  buildId: string
  plan: string
  repoPath: string
}

function findClaudeBinary(): string {
  return '/Users/oskarglauser/.local/bin/claude'
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
    '--max-turns',
    '50',
  ]

  // Ensure cwd exists
  if (!existsSync(cwd)) {
    mkdirSync(cwd, { recursive: true })
  }

  const escapedArgs = args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(' ')
  const cmd = `${bin} ${escapedArgs} < /dev/null`

  return spawn('bash', ['-c', cmd], {
    cwd,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function buildShapeDescription(shapes: ShapeInfo[]): string {
  if (shapes.length === 0) return 'No shapes defined.'

  const lines: string[] = []
  for (const shape of shapes) {
    const desc = shape.description ? ` - ${shape.description}` : ''
    lines.push(`  - [${shape.type}] "${shape.label}"${desc} (id: ${shape.id})`)

    if (shape.connections && shape.connections.length > 0) {
      for (const conn of shape.connections) {
        const connLabel = conn.label ? ` (${conn.label})` : ''
        lines.push(`      -> connects to ${conn.to}${connLabel}`)
      }
    }
  }
  return lines.join('\n')
}

function setupSSE(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
}

function streamClaudeProcess(
  child: ChildProcessWithoutNullStreams,
  req: Request,
  res: Response,
  onComplete: (fullText: string, exitCode: number | null) => void,
  onError: (error: string) => void
): void {
  let fullText = ''
  let buffer = ''

  child.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString()

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      try {
        const parsed = JSON.parse(trimmed)

        // Accumulate assistant text
        if (parsed.type === 'assistant' && parsed.message?.content) {
          for (const block of parsed.message.content) {
            if (block.type === 'text') {
              fullText += block.text
            }
          }
        }

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
    onComplete(fullText, code)
  })

  child.on('error', (err) => {
    onError(err.message)
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`)
    res.end()
  })

  // Handle client disconnect
  res.on('close', () => {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  })
}

// POST /plan - Generate a build plan via SSE streaming
buildRouter.post('/plan', (req: Request, res: Response) => {
  const { pageId, shapes, repoPath } = req.body as PlanRequest

  if (!pageId || !shapes || !repoPath) {
    return res.status(400).json({ error: 'pageId, shapes, and repoPath are required' })
  }

  const db = getDb()
  const buildId = uuid()

  // Create build record with status 'planning'
  try {
    db.prepare(
      `INSERT INTO builds (id, page_id, status, selected_shapes) VALUES (?, ?, 'planning', ?)`
    ).run(buildId, pageId, JSON.stringify(shapes.map((s) => s.id)))
  } catch (err: any) {
    console.error('[build] DB insert error:', err.message)
    return res.status(500).json({ error: err.message })
  }

  setupSSE(res)

  // Send build ID immediately
  res.write(`data: ${JSON.stringify({ type: 'build', buildId })}\n\n`)

  const shapeDesc = buildShapeDescription(shapes)

  const prompt = [
    `You are an expert software architect and developer. Analyze the following UI component design from a visual canvas and create a detailed build plan.`,
    '',
    `Canvas shapes and their relationships:`,
    shapeDesc,
    '',
    `Instructions:`,
    `1. First, explore the existing codebase to understand the project structure, tech stack, and conventions.`,
    `2. Based on the canvas shapes (which represent UI components, data flows, and relationships), create a structured build plan.`,
    `3. The plan should specify exactly which files to create or modify, what code to write, and in what order.`,
    '',
    `Output your plan as a structured JSON object with this format:`,
    `{`,
    `  "summary": "Brief description of what will be built",`,
    `  "steps": [`,
    `    {`,
    `      "id": "step-1",`,
    `      "title": "Step title",`,
    `      "description": "What this step does",`,
    `      "files": ["path/to/file.ts"],`,
    `      "action": "create" | "modify"`,
    `    }`,
    `  ],`,
    `  "estimatedFiles": number,`,
    `  "dependencies": ["any new packages needed"]`,
    `}`,
    '',
    `Be thorough but practical. Focus on producing working code.`,
  ].join('\n')

  const child = spawnClaude(prompt, 'Read,Glob,Grep', repoPath)

  streamClaudeProcess(
    child,
    req,
    res,
    (fullText, exitCode) => {
      // Save the plan to the build record
      db.prepare(`UPDATE builds SET plan = ?, status = 'pending' WHERE id = ?`).run(
        fullText,
        buildId
      )

      res.write(
        `data: ${JSON.stringify({ type: 'done', buildId, exitCode })}\n\n`
      )
      res.end()
    },
    (error) => {
      db.prepare(`UPDATE builds SET status = 'error', error = ? WHERE id = ?`).run(error, buildId)
    }
  )
})

// POST /execute - Execute a build plan via SSE streaming
buildRouter.post('/execute', (req: Request, res: Response) => {
  const { buildId, plan, repoPath } = req.body as ExecuteRequest

  if (!buildId || !plan || !repoPath) {
    return res.status(400).json({ error: 'buildId, plan, and repoPath are required' })
  }

  const db = getDb()

  // Verify build exists
  const build = db.prepare('SELECT * FROM builds WHERE id = ?').get(buildId) as Build | undefined
  if (!build) {
    return res.status(404).json({ error: 'Build not found' })
  }

  // Update status to building
  db.prepare(`UPDATE builds SET status = 'building' WHERE id = ?`).run(buildId)

  setupSSE(res)

  res.write(`data: ${JSON.stringify({ type: 'build', buildId, status: 'building' })}\n\n`)

  const prompt = [
    `You are an expert software developer. Execute the following build plan precisely and completely.`,
    '',
    `Build Plan:`,
    plan,
    '',
    `Instructions:`,
    `1. Follow the plan step by step.`,
    `2. For each step, create or modify the specified files with working, production-quality code.`,
    `3. Follow the existing code conventions in the project (imports, formatting, naming, etc).`,
    `4. After making changes, verify the code is correct by reading back the files you modified.`,
    `5. If you encounter issues, adapt and fix them rather than stopping.`,
    '',
    `Execute the plan now. Create all necessary files and modifications.`,
  ].join('\n')

  const child = spawnClaude(prompt, 'Read,Write,Edit,Bash,Glob,Grep', repoPath)

  streamClaudeProcess(
    child,
    req,
    res,
    (fullText, exitCode) => {
      const success = exitCode === 0

      if (success) {
        db.prepare(
          `UPDATE builds SET status = 'completed', result = ?, completed_at = datetime('now') WHERE id = ?`
        ).run(fullText, buildId)
      } else {
        db.prepare(
          `UPDATE builds SET status = 'error', error = ?, completed_at = datetime('now') WHERE id = ?`
        ).run(`Process exited with code ${exitCode}`, buildId)
      }

      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          buildId,
          status: success ? 'completed' : 'error',
          exitCode,
        })}\n\n`
      )
      res.end()
    },
    (error) => {
      db.prepare(
        `UPDATE builds SET status = 'error', error = ?, completed_at = datetime('now') WHERE id = ?`
      ).run(error, buildId)
    }
  )
})

// GET /:id - Get build by ID
buildRouter.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const build = db.prepare('SELECT * FROM builds WHERE id = ?').get(req.params.id) as
    | Build
    | undefined

  if (!build) {
    return res.status(404).json({ error: 'Build not found' })
  }

  res.json(build)
})
