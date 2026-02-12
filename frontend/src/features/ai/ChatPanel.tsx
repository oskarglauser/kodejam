import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useAIChat } from './hooks/useAIChat'

interface SelectedShape {
  id: string
  type: string
  label?: string
}

interface ChatPanelProps {
  selectedShapes: SelectedShape[]
  repoPath: string
  pageName: string
  onClose: () => void
}

export function ChatPanel({ selectedShapes, repoPath, pageName, onClose }: ChatPanelProps) {
  const { messages, sendMessage, isStreaming, cancelStream } = useAIChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    sendMessage(trimmed, {
      shapes: selectedShapes,
      repoPath,
      pageName,
    })
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>AI Chat</span>
        <button onClick={onClose} style={styles.closeButton} title="Close chat">
          &times;
        </button>
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
            Ask the AI about your design, request code changes, or get help building components.
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
                <pre style={styles.preformatted}>{msg.content || '\u00A0'}</pre>
              ) : (
                <span>{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div style={styles.streamingIndicator}>
            <span style={styles.dot}>&#9679;</span>
            <span style={styles.dot}>&#9679;</span>
            <span style={styles.dot}>&#9679;</span>
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
          placeholder="Ask the AI..."
          rows={2}
          style={styles.textarea}
          disabled={isStreaming}
        />
        <div style={styles.inputActions}>
          {isStreaming ? (
            <button onClick={cancelStream} style={styles.cancelButton}>
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                ...styles.sendButton,
                opacity: input.trim() ? 1 : 0.4,
                cursor: input.trim() ? 'pointer' : 'default',
              }}
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 380,
    display: 'flex',
    flexDirection: 'column',
    background: '#ffffff',
    borderLeft: '1px solid #e5e7eb',
    boxShadow: '-4px 0 16px rgba(0,0,0,0.06)',
    zIndex: 1000,
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
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
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
  preformatted: {
    margin: 0,
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
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
    animation: 'none', // CSS keyframes not used with inline styles; dots remain static
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
