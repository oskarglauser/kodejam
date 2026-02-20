import { useState, useRef, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

interface Viewport {
  label: string
  width: number
  height: number
}

const VIEWPORTS: Viewport[] = [
  { label: 'Desktop', width: 1280, height: 800 },
  { label: 'Tablet', width: 768, height: 1024 },
  { label: 'Mobile', width: 375, height: 812 },
]

interface ScreenshotPopoverProps {
  devUrl: string
  onCapture: (url: string, width: number, height: number) => Promise<void>
  onClose: () => void
}

export function ScreenshotPopover({ devUrl, onCapture, onClose }: ScreenshotPopoverProps) {
  const [path, setPath] = useState('/')
  const [viewport, setViewport] = useState<Viewport>(VIEWPORTS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus path input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const hostDisplay = (() => {
    try {
      return new URL(devUrl).host
    } catch {
      return devUrl
    }
  })()

  const handleCapture = async () => {
    setError('')
    setLoading(true)
    try {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      const fullUrl = devUrl.replace(/\/$/, '') + normalizedPath
      await onCapture(fullUrl, viewport.width, viewport.height)
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 600)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] bg-white border border-border/60 rounded-xl shadow-xl p-5 w-80"
    >
      {/* URL input */}
      <label className="text-xs font-semibold text-foreground mb-1.5 block">URL</label>
      <div className="flex items-center gap-0 mb-3">
        <span className="shrink-0 px-2.5 py-[7px] text-xs font-medium bg-secondary text-muted-foreground border border-r-0 border-input rounded-l-md truncate max-w-[140px]">
          {hostDisplay}
        </span>
        <Input
          ref={inputRef}
          value={path}
          onChange={(e) => setPath(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCapture()
          }}
          placeholder="/dashboard"
          className="rounded-l-none"
        />
      </div>

      {/* Viewport presets */}
      <label className="text-xs font-semibold text-foreground mb-1.5 block">Viewport</label>
      <div className="flex gap-1.5 mb-4">
        {VIEWPORTS.map((vp) => (
          <button
            key={vp.label}
            onClick={() => setViewport(vp)}
            className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-colors ${
              viewport.label === vp.label
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            <div>{vp.label}</div>
            <div className="text-[10px] opacity-70">{vp.width}x{vp.height}</div>
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive mb-2">{error}</p>
      )}

      {/* Capture button */}
      <Button
        onClick={handleCapture}
        disabled={loading || success}
        className="w-full"
        size="sm"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Capturing...
          </span>
        ) : success ? (
          <span className="flex items-center gap-1.5 text-green-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Done
          </span>
        ) : (
          'Capture Screenshot'
        )}
      </Button>
    </div>
  )
}
