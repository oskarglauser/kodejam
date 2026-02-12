import { useState, useCallback, useRef } from 'react'
import type { ChatMessage } from '../../../types'

interface ChatContext {
  shapes: Array<{ id: string; type: string; label?: string; props?: Record<string, unknown> }>
  repoPath: string
  pageName: string
}

interface SSEEvent {
  type: string
  content?: Array<{ type: string; text?: string }>
  result?: { text?: string }
  text?: string
  delta?: { type: string; text?: string }
  [key: string]: unknown
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (message: string, context: ChatContext) => {
      // Add user message immediately
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])
      setIsStreaming(true)

      // Create a placeholder assistant message that we'll stream into
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            shapes: context.shapes,
            repoPath: context.repoPath,
            pageName: context.pageName,
            threadId,
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Chat API error ${res.status}: ${errorText}`)
        }

        if (!res.body) {
          throw new Error('Response body is null')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Process SSE lines from buffer
          const lines = buffer.split('\n')
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()

            // Skip empty lines and SSE comments
            if (!trimmed || trimmed.startsWith(':')) continue

            // Parse SSE data lines
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6)

              // Handle stream end signal
              if (data === '[DONE]') continue

              try {
                const event: SSEEvent = JSON.parse(data)
                const text = extractText(event)
                if (text) {
                  accumulated += text
                  // Update the assistant message with accumulated text
                  setMessages((prev) => {
                    const updated = [...prev]
                    const lastIdx = updated.length - 1
                    if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                      updated[lastIdx] = {
                        ...updated[lastIdx],
                        content: accumulated,
                      }
                    }
                    return updated
                  })
                }

                // Extract thread ID if provided
                if (event.type === 'thread_id' && typeof event.threadId === 'string') {
                  setThreadId(event.threadId)
                }
              } catch {
                // Skip unparseable lines; may be partial JSON or non-JSON SSE data
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Streaming was cancelled by user; nothing to do
          return
        }

        const errorContent =
          err instanceof Error ? err.message : 'An unexpected error occurred'

        // Replace the empty assistant message with the error
        setMessages((prev) => {
          const updated = [...prev]
          const lastIdx = updated.length - 1
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: `Error: ${errorContent}`,
            }
          }
          return updated
        })
      } finally {
        setIsStreaming(false)
        abortControllerRef.current = null
      }
    },
    [threadId],
  )

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  return {
    messages,
    sendMessage,
    isStreaming,
    threadId,
    cancelStream,
  }
}

/**
 * Extract text content from various Claude Code SDK streaming event formats.
 *
 * The SSE stream can emit events in several shapes:
 *  - { type: "content_block_delta", delta: { type: "text_delta", text: "..." } }
 *  - { type: "result", content: [{ type: "text", text: "..." }] }
 *  - { type: "text", text: "..." }
 *  - { type: "assistant", content: "..." }
 *  - { text: "..." }  (simple passthrough from backend)
 */
function extractText(event: SSEEvent): string {
  // content_block_delta from Anthropic streaming API
  if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta' && event.delta.text) {
    return event.delta.text
  }

  // Result message with content array
  if (event.type === 'result' && Array.isArray(event.content)) {
    return event.content
      .filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text ?? '')
      .join('')
  }

  // Simple text event
  if (event.type === 'text' && typeof event.text === 'string') {
    return event.text
  }

  // Assistant message with direct content string
  if (event.type === 'assistant' && typeof event.content === 'string') {
    return event.content
  }

  // Passthrough text field
  if (typeof event.text === 'string' && !event.type) {
    return event.text
  }

  return ''
}
