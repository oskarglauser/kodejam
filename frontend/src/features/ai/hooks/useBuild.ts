import { useState, useCallback, useRef } from 'react'

export type BuildFlowStatus =
  | 'idle'
  | 'planning'
  | 'showing-plan'
  | 'building'
  | 'completed'
  | 'error'

export interface PlanStep {
  file: string
  action: 'create' | 'modify' | 'delete'
  description: string
}

export interface BuildPlan {
  summary: string
  steps: PlanStep[]
}

interface SSEEvent {
  type: string
  plan?: BuildPlan
  buildId?: string
  text?: string
  progress?: string
  status?: string
  error?: string
  delta?: { type: string; text?: string }
  [key: string]: unknown
}

export function useBuild() {
  const [plan, setPlan] = useState<BuildPlan | null>(null)
  const [buildId, setBuildId] = useState<string | null>(null)
  const [status, setStatus] = useState<BuildFlowStatus>('idle')
  const [progress, setProgress] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const readSSEStream = useCallback(
    async (
      response: Response,
      onEvent: (event: SSEEvent) => void,
    ) => {
      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue

          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6)
            if (data === '[DONE]') continue

            try {
              const event: SSEEvent = JSON.parse(data)
              onEvent(event)
            } catch {
              // Skip unparseable lines
            }
          }
        }
      }
    },
    [],
  )

  const startPlan = useCallback(
    async (
      shapes: Array<{ id: string; type: string; label?: string; props?: Record<string, unknown> }>,
      repoPath: string,
      pageId?: string,
    ) => {
      setStatus('planning')
      setPlan(null)
      setBuildId(null)
      setProgress([])
      setError(null)

      const controller = new AbortController()
      abortControllerRef.current = controller

      let accumulatedPlanText = ''

      try {
        const res = await fetch('/api/build/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId, shapes, repoPath }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(`Plan API error ${res.status}: ${errText}`)
        }

        await readSSEStream(res, (event) => {
          // The backend may send the plan in different event formats:

          // Complete plan object
          if (event.type === 'plan' && event.plan) {
            setPlan(event.plan)
          }

          // Build ID assignment
          if (event.type === 'build_id' && event.buildId) {
            setBuildId(event.buildId)
          }

          // Streamed text chunks that form the plan
          if (event.type === 'text' && typeof event.text === 'string') {
            accumulatedPlanText += event.text
            setProgress((prev) => {
              // Replace the last progress line if it was a partial plan text
              const newProgress = [...prev]
              const lastIdx = newProgress.length - 1
              if (lastIdx >= 0 && newProgress[lastIdx].startsWith('[plan] ')) {
                newProgress[lastIdx] = `[plan] ${accumulatedPlanText}`
              } else {
                newProgress.push(`[plan] ${accumulatedPlanText}`)
              }
              return newProgress
            })
          }

          // Content block deltas (Anthropic streaming format)
          if (event.type === 'content_block_delta' && event.delta?.text) {
            accumulatedPlanText += event.delta.text
          }

          // Progress updates
          if (event.type === 'progress' && typeof event.progress === 'string') {
            setProgress((prev) => [...prev, event.progress!])
          }

          // Error from stream
          if (event.type === 'error' && typeof event.error === 'string') {
            setError(event.error)
            setStatus('error')
          }
        })

        // If we accumulated text but never got a structured plan, try to parse it
        if (!plan && accumulatedPlanText) {
          try {
            const parsed = JSON.parse(accumulatedPlanText)
            if (parsed.summary && parsed.steps) {
              setPlan(parsed)
            }
          } catch {
            // If the plan text is not JSON, create a simple plan from it
            setPlan({
              summary: accumulatedPlanText,
              steps: [],
            })
          }
        }

        // Transition to showing-plan unless there was an error
        setStatus((prev) => (prev === 'error' ? 'error' : 'showing-plan'))
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          setStatus('idle')
          return
        }
        setError(err instanceof Error ? err.message : 'Planning failed')
        setStatus('error')
      } finally {
        abortControllerRef.current = null
      }
    },
    [readSSEStream],
  )

  const executePlan = useCallback(
    async (execBuildId: string, execPlan: BuildPlan, repoPath: string) => {
      setStatus('building')
      setProgress([])
      setError(null)

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const res = await fetch('/api/build/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buildId: execBuildId,
            plan: execPlan,
            repoPath,
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(`Execute API error ${res.status}: ${errText}`)
        }

        await readSSEStream(res, (event) => {
          // Progress updates during execution
          if (event.type === 'progress' && typeof event.progress === 'string') {
            setProgress((prev) => [...prev, event.progress!])
          }

          // File-level status updates
          if (event.type === 'file_status' && typeof event.text === 'string') {
            setProgress((prev) => [...prev, event.text!])
          }

          // Streamed text output
          if (event.type === 'text' && typeof event.text === 'string') {
            setProgress((prev) => [...prev, event.text!])
          }

          // Build completion
          if (event.type === 'complete' || event.type === 'done') {
            setStatus('completed')
          }

          // Error during execution
          if (event.type === 'error' && typeof event.error === 'string') {
            setError(event.error)
            setStatus('error')
          }
        })

        // If we reached here without an explicit complete event, mark as completed
        setStatus((prev) => (prev === 'error' ? 'error' : 'completed'))
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          setStatus('idle')
          return
        }
        setError(err instanceof Error ? err.message : 'Build execution failed')
        setStatus('error')
      } finally {
        abortControllerRef.current = null
      }
    },
    [readSSEStream],
  )

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setPlan(null)
    setBuildId(null)
    setStatus('idle')
    setProgress([])
    setError(null)
  }, [])

  const isPlanning = status === 'planning'
  const isBuilding = status === 'building'

  return {
    plan,
    buildId,
    status,
    progress,
    error,
    startPlan,
    executePlan,
    reset,
    isPlanning,
    isBuilding,
  }
}
