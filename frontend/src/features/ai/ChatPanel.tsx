import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import Markdown from 'react-markdown'
import { useAIChat, type ScreenshotEvent } from './hooks/useAIChat'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { Chip } from '../../components/ui/chip'

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
  width?: number
  onWidthChange?: (w: number) => void
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
  width = 380,
  onWidthChange,
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
  const hasScrolledInitialRef = useRef(false)

  // Load existing chat thread for this page on mount
  useEffect(() => {
    if (!threadLoadedRef.current && pageId) {
      threadLoadedRef.current = true
      loadThread(pageId)
    }
  }, [pageId, loadThread])

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (!hasScrolledInitialRef.current && messages.length > 0) {
      hasScrolledInitialRef.current = true
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
    } else if (hasScrolledInitialRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, screenshotPreviews, isCapturingScreenshots, isBuilding])

  // Auto-send initial message (e.g., from Build button)
  const initialMessageSentRef = useRef(false)
  useEffect(() => {
    if (initialMessage && !initialMessageSentRef.current && !isStreaming) {
      initialMessageSentRef.current = true
      setIsBuildPlan(true)
      setScreenshotPreviews([])
      clearMessages()
      sendMessage(initialMessage, {
        shapes: selectedShapes,
        repoPath,
        pageName,
        pageId,
        devUrl,
      })
      if (onInitialMessageConsumed) onInitialMessageConsumed()
    }
  }, [initialMessage, isStreaming, sendMessage, selectedShapes, repoPath, pageName, pageId, devUrl, onInitialMessageConsumed, clearMessages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close panel on Escape key
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

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
    const planMessage = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!planMessage) return

    setIsBuildPlan(false)
    setIsBuilding(true)

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

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width
    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX
      const newWidth = Math.max(280, Math.min(700, startWidth + delta))
      onWidthChange?.(newWidth)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [width, onWidthChange])

  const showPlanApproval = isBuildPlan && !isStreaming && !isBuilding && messages.length > 0 && messages[messages.length - 1].role === 'assistant'

  return (
    <div className="relative flex flex-col bg-white border-l border-border" style={{ width, minWidth: width }}>
      {/* Resize handle */}
      {onWidthChange && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 gap-2">
        <span className="text-sm font-semibold text-foreground">Claude</span>
        {devUrl && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 font-medium flex-1 text-right truncate" title={devUrl}>
            {new URL(devUrl).host}
          </span>
        )}
        {messages.length > 0 && (
          <button
            onClick={() => { clearMessages(); setIsBuildPlan(false) }}
            className="bg-transparent border-none text-muted-foreground cursor-pointer p-0.5 flex items-center rounded hover:text-foreground"
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
        <div className="flex items-center gap-2 px-4 py-2 border-b border-secondary shrink-0 flex-wrap">
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Context:</span>
          <div className="flex gap-1 flex-wrap">
            {selectedShapes.map((shape) => (
              <Chip key={shape.id}>
                {shape.label || shape.type}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-[13px] py-10 px-5 leading-relaxed">
            {devUrl
              ? 'Ask the AI about your design, request screenshots of your app, or get help building components.'
              : 'Ask the AI about your design, request code changes, or get help building components.'}
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed break-words ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-secondary text-secondary-foreground rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                stripScreenshotCommands(msg.content) ? (
                  <div className="chat-markdown text-[13px] leading-relaxed">
                    <Markdown>{stripScreenshotCommands(msg.content)}</Markdown>
                  </div>
                ) : (isStreaming || isBuilding) && idx === messages.length - 1 ? (
                  <div className="flex gap-1 py-1 items-center">
                    <span className="text-[8px] text-muted-foreground animate-[dotPulse_1.2s_ease-in-out_infinite]">&#9679;</span>
                    <span className="text-[8px] text-muted-foreground animate-[dotPulse_1.2s_ease-in-out_infinite_0.2s]">&#9679;</span>
                    <span className="text-[8px] text-muted-foreground animate-[dotPulse_1.2s_ease-in-out_infinite_0.4s]">&#9679;</span>
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

        {/* Streaming activity indicator */}
        {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].content && (
          <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-[buildPulse_1.5s_infinite]" />
            <span>Thinking...</span>
          </div>
        )}

        {/* Plan approval buttons */}
        {showPlanApproval && (
          <div className="flex gap-2 py-1">
            <Button onClick={handleProceedBuild} size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
              Proceed with Build
            </Button>
            <Button
              onClick={() => { setIsBuildPlan(false); inputRef.current?.focus() }}
              variant="outline"
              size="sm"
            >
              Edit Plan
            </Button>
          </div>
        )}

        {/* Building indicator */}
        {isBuilding && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg text-xs text-primary font-medium">
            <div className="w-2 h-2 rounded-full bg-primary animate-[buildPulse_1.5s_infinite]" />
            <span>Building...</span>
            <button onClick={handleCancelBuild} className="ml-auto px-2 py-0.5 text-[11px] text-destructive bg-transparent border border-destructive rounded cursor-pointer">Cancel</button>
          </div>
        )}

        {/* Screenshot capturing indicator */}
        {isCapturingScreenshots && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg text-xs text-yellow-800">
            <span className="text-base">📸</span>
            <span>Capturing screenshots...</span>
          </div>
        )}

        {/* Screenshot added confirmation */}
        {screenshotPreviews.length > 0 && (
          <div className="px-3 py-2 bg-green-50 rounded-lg text-xs text-green-600 font-medium">
            Added {screenshotPreviews.length} screenshot{screenshotPreviews.length > 1 ? 's' : ''} to canvas
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-3 shrink-0">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={devUrl ? 'Ask the AI... (try "show me the homepage")' : 'Ask the AI...'}
          rows={2}
          disabled={isStreaming || isBuilding}
          className="font-[inherit]"
        />
        <div className="flex justify-end mt-2">
          {isStreaming ? (
            <Button onClick={cancelStream} variant="destructive" size="sm">
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isBuilding}
              size="sm"
            >
              Send
            </Button>
          )}
        </div>
      </div>
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
