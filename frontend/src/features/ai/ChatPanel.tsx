import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import Markdown from 'react-markdown'
import { useAIChat, type ScreenshotEvent } from './hooks/useAIChat'

interface SelectedShape {
  id: string
  type: string
  label?: string
  description?: string
  imageUrl?: string
}

interface ChatPanelProps {
  selectedShapes: SelectedShape[]
  repoPath: string
  pageName: string
  pageId: string
  devUrl?: string
  onClose: () => void
  onCreateScreenshot?: (imageUrl: string, description: string, filePath?: string) => void
  onScreenshotsStart?: () => void
  initialMessage?: string
  onInitialMessageConsumed?: () => void
}

export function ChatPanel({
  selectedShapes,
  repoPath,
  pageName,
  pageId,
  devUrl,
  onClose,
  onCreateScreenshot,
  onScreenshotsStart,
  initialMessage,
  onInitialMessageConsumed,
}: ChatPanelProps) {
  const [screenshotPreviews, setScreenshotPreviews] = useState<ScreenshotEvent[]>([])
  const [isBuildPlan, setIsBuildPlan] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const buildAbortRef = useRef<AbortController | null>(null)

  const handleScreenshot = useCallback(
    (screenshot: ScreenshotEvent) => {
      setScreenshotPreviews((prev) => [...prev, screenshot])
      if (onCreateScreenshot) {
        onCreateScreenshot(screenshot.imageUrl, screenshot.description, screenshot.filePath)
      }
    },
    [onCreateScreenshot]
  )

  const { messages, setMessages, sendMessage, isStreaming, isCapturingScreenshots, cancelStream, clearMessages, loadThread } =
    useAIChat(handleScreenshot, onScreenshotsStart)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const threadLoadedRef = useRef(false)

  // Load existing chat thread for this page on mount
  useEffect(() => {
    if (!threadLoadedRef.current && pageId) {
      threadLoadedRef.current = true
      loadThread(pageId)
    }
  }, [pageId, loadThread])

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, screenshotPreviews, isCapturingScreenshots, isBuilding])

  // Auto-send initial message (e.g., from Build button)
  const initialMessageSentRef = useRef(false)
  useEffect(() => {
    if (initialMessage && !initialMessageSentRef.current && !isStreaming) {
      initialMessageSentRef.current = true
      setIsBuildPlan(true)
      setScreenshotPreviews([])
      sendMessage(initialMessage, {
        shapes: selectedShapes,
        repoPath,
        pageName,
        pageId,
        devUrl,
      })
      if (onInitialMessageConsumed) onInitialMessageConsumed()
    }
  }, [initialMessage, isStreaming, sendMessage, selectedShapes, repoPath, pageName, pageId, devUrl, onInitialMessageConsumed])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming || isBuilding) return

    setScreenshotPreviews([])
    setIsBuildPlan(false)

    sendMessage(trimmed, {
      shapes: selectedShapes,
      repoPath,
      pageName,
      pageId,
      devUrl,
    })
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Execute the build plan via /api/build/execute
  const handleProceedBuild = useCallback(async () => {
    // Find the last assistant message (the plan)
    const planMessage = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!planMessage) return

    setIsBuildPlan(false)
    setIsBuilding(true)

    // Add a user message indicating approval
    const userMsg = { role: 'user' as const, content: 'Proceed with the build plan.', timestamp: new Date().toISOString() }
    const assistantMsg = { role: 'assistant' as const, content: '', timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg, assistantMsg])

    const controller = new AbortController()
    buildAbortRef.current = controller

    try {
      const res = await fetch('/api/build/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildId: `inline-${Date.now()}`,
          plan: planMessage.content,
          repoPath,
        }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error(`Build API error: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':') || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') continue

          try {
            const event = JSON.parse(data)
            const text = extractBuildText(event)
            if (text) {
              accumulated += text
              setMessages((prev) => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                  updated[lastIdx] = { ...updated[lastIdx], content: accumulated }
                }
                return updated
              })
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Build failed'
      setMessages((prev) => {
        const updated = [...prev]
        const lastIdx = updated.length - 1
        if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
          updated[lastIdx] = { ...updated[lastIdx], content: `Error: ${msg}` }
        }
        return updated
      })
    } finally {
      setIsBuilding(false)
      buildAbortRef.current = null
    }
  }, [messages, repoPath, setMessages])

  const handleCancelBuild = useCallback(() => {
    buildAbortRef.current?.abort()
  }, [])

  // Show plan approval buttons when: plan is done streaming, it was a build plan, and not currently building
  const showPlanApproval = isBuildPlan && !isStreaming && !isBuilding && messages.length > 0 && messages[messages.length - 1].role === 'assistant'

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>AI Chat</span>
        {devUrl && (
          <span style={styles.devUrlBadge} title={devUrl}>
            {new URL(devUrl).host}
          </span>
        )}
        {messages.length > 0 && (
          <button
            onClick={() => { clearMessages(); setIsBuildPlan(false) }}
            style={styles.headerIconButton}
            title="Clear chat"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Context chips */}
      {selectedShapes.length > 0 && (
        <div style={styles.contextBar}>
          <span style={styles.contextLabel}>Context:</span>
          <div style={styles.chipContainer}>
            {selectedShapes.map((shape) => (
              <span key={shape.id} style={styles.chip}>
                {shape.label || shape.type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            {devUrl
              ? 'Ask the AI about your design, request screenshots of your app, or get help building components.'
              : 'Ask the AI about your design, request code changes, or get help building components.'}
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.messageRow,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                ...styles.messageBubble,
                ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble),
              }}
            >
              {msg.role === 'assistant' ? (
                stripScreenshotCommands(msg.content) ? (
                  <div className="chat-markdown" style={styles.markdownContainer}>
                    <Markdown>{stripScreenshotCommands(msg.content)}</Markdown>
                  </div>
                ) : (isStreaming || isBuilding) && idx === messages.length - 1 ? (
                  <div style={styles.streamingIndicator}>
                    <span className="streaming-dot" style={{ ...styles.dot, animationDelay: '0s' }}>&#9679;</span>
                    <span className="streaming-dot" style={{ ...styles.dot, animationDelay: '0.2s' }}>&#9679;</span>
                    <span className="streaming-dot" style={{ ...styles.dot, animationDelay: '0.4s' }}>&#9679;</span>
                  </div>
                ) : (
                  <span>&nbsp;</span>
                )
              ) : (
                <span>{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {/* Plan approval buttons */}
        {showPlanApproval && (
          <div style={styles.planApproval}>
            <button onClick={handleProceedBuild} style={styles.proceedButton}>
              Proceed with Build
            </button>
            <button
              onClick={() => { setIsBuildPlan(false); inputRef.current?.focus() }}
              style={styles.editPlanButton}
            >
              Edit Plan
            </button>
          </div>
        )}

        {/* Building indicator */}
        {isBuilding && (
          <div style={styles.buildingIndicator}>
            <div style={styles.buildingDot} />
            <span>Building...</span>
            <button onClick={handleCancelBuild} style={styles.cancelBuildButton}>Cancel</button>
          </div>
        )}

        {/* Screenshot capturing indicator */}
        {isCapturingScreenshots && (
          <div style={styles.screenshotCapturing}>
            <div style={styles.captureIcon}>📸</div>
            <span>Capturing screenshots...</span>
          </div>
        )}

        {/* Screenshot added confirmation */}
        {screenshotPreviews.length > 0 && (
          <div style={styles.screenshotAdded}>
            Added {screenshotPreviews.length} screenshot{screenshotPreviews.length > 1 ? 's' : ''} to canvas
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={styles.inputArea}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={devUrl ? 'Ask the AI... (try "show me the homepage")' : 'Ask the AI...'}
          rows={2}
          style={styles.textarea}
          disabled={isStreaming || isBuilding}
        />
        <div style={styles.inputActions}>
          {isStreaming ? (
            <button onClick={cancelStream} style={styles.cancelButton}>
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || isBuilding}
              style={{
                ...styles.sendButton,
                opacity: input.trim() && !isBuilding ? 1 : 0.4,
                cursor: input.trim() && !isBuilding ? 'pointer' : 'default',
              }}
            >
              Send
            </button>
          )}
        </div>
      </div>

      {/* Markdown styles */}
      <style>{markdownStyles}</style>
    </div>
  )
}

function extractBuildText(event: any): string {
  if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta' && event.delta.text) {
    return event.delta.text
  }
  if (event.type === 'assistant' && event.message?.content) {
    return event.message.content
      .filter((b: any) => b.type === 'text' && b.text)
      .map((b: any) => b.text)
      .join('')
  }
  return ''
}

function stripScreenshotCommands(text: string): string {
  return text.replace(/\[SCREENSHOT:\{[^]*?\}\]/g, '').replace(/\n{3,}/g, '\n\n').trim()
}

const markdownStyles = `
.chat-markdown p { margin: 0 0 8px 0; }
.chat-markdown p:last-child { margin-bottom: 0; }
.chat-markdown code {
  background: rgba(0,0,0,0.06);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 12px;
  font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
}
.chat-markdown pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 8px 10px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 6px 0;
  font-size: 11px;
  line-height: 1.5;
}
.chat-markdown pre code {
  background: none;
  padding: 0;
  color: inherit;
  font-size: inherit;
}
.chat-markdown ul, .chat-markdown ol {
  margin: 4px 0;
  padding-left: 20px;
}
.chat-markdown li { margin: 2px 0; }
.chat-markdown h1, .chat-markdown h2, .chat-markdown h3 {
  margin: 8px 0 4px 0;
  font-weight: 600;
}
.chat-markdown h1 { font-size: 15px; }
.chat-markdown h2 { font-size: 14px; }
.chat-markdown h3 { font-size: 13px; }
.chat-markdown blockquote {
  border-left: 3px solid #d1d5db;
  margin: 4px 0;
  padding-left: 10px;
  color: #6b7280;
}
.chat-markdown a {
  color: #2563eb;
  text-decoration: underline;
}
.chat-markdown hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 8px 0;
}
@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
@keyframes buildPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
`

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 380,
    minWidth: 380,
    display: 'flex',
    flexDirection: 'column',
    background: '#ffffff',
    borderLeft: '1px solid #e5e7eb',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0,
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
  },
  devUrlBadge: {
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 4,
    background: '#f0fdf4',
    color: '#16a34a',
    fontWeight: 500,
    flex: 1,
    textAlign: 'right' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  headerIconButton: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '2px 4px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 4,
  },

  // Context chips
  contextBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderBottom: '1px solid #f3f4f6',
    flexShrink: 0,
    flexWrap: 'wrap' as const,
  },
  contextLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  chipContainer: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap' as const,
  },
  chip: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 12,
    background: '#eff6ff',
    color: '#2563eb',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
  },

  // Messages
  messagesContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  emptyState: {
    textAlign: 'center' as const,
    color: '#9ca3af',
    fontSize: 13,
    padding: '40px 20px',
    lineHeight: 1.6,
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: '8px 12px',
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.5,
    wordBreak: 'break-word' as const,
  },
  userBubble: {
    background: '#2563eb',
    color: '#ffffff',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    background: '#f3f4f6',
    color: '#1f2937',
    borderBottomLeftRadius: 4,
  },
  markdownContainer: {
    fontSize: 13,
    lineHeight: 1.5,
  },

  // Plan approval
  planApproval: {
    display: 'flex',
    gap: 8,
    padding: '4px 0',
  },
  proceedButton: {
    padding: '8px 16px',
    fontSize: 12,
    fontWeight: 600,
    color: '#ffffff',
    background: '#16a34a',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    flex: 1,
  },
  editPlanButton: {
    padding: '8px 16px',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: 'pointer',
  },

  // Building indicator
  buildingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: '#eff6ff',
    borderRadius: 8,
    fontSize: 12,
    color: '#2563eb',
    fontWeight: 500,
  },
  buildingDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#2563eb',
    animationName: 'buildPulse',
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
  },
  cancelBuildButton: {
    marginLeft: 'auto',
    padding: '2px 8px',
    fontSize: 11,
    color: '#ef4444',
    background: 'none',
    border: '1px solid #ef4444',
    borderRadius: 4,
    cursor: 'pointer',
  },

  // Screenshot capturing
  screenshotCapturing: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: '#fefce8',
    borderRadius: 8,
    fontSize: 12,
    color: '#854d0e',
  },
  captureIcon: {
    fontSize: 16,
  },

  // Screenshot added confirmation
  screenshotAdded: {
    padding: '8px 12px',
    background: '#f0fdf4',
    borderRadius: 8,
    fontSize: 12,
    color: '#16a34a',
    fontWeight: 500,
  },

  // Streaming indicator
  streamingIndicator: {
    display: 'flex',
    gap: 4,
    padding: '4px 0',
    alignItems: 'center',
  },
  dot: {
    fontSize: 8,
    color: '#9ca3af',
    animationName: 'dotPulse',
    animationDuration: '1.2s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  },

  // Input area
  inputArea: {
    borderTop: '1px solid #e5e7eb',
    padding: '12px 16px',
    flexShrink: 0,
  },
  textarea: {
    width: '100%',
    resize: 'none' as const,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: 'inherit',
    lineHeight: 1.5,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  inputActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  sendButton: {
    padding: '6px 16px',
    fontSize: 12,
    fontWeight: 600,
    color: '#ffffff',
    background: '#2563eb',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '6px 16px',
    fontSize: 12,
    fontWeight: 600,
    color: '#ffffff',
    background: '#ef4444',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
}
