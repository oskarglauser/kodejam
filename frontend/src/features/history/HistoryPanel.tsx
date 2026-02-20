import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { IconButton } from '../../components/ui/icon-button'
import type { CanvasHistory } from '../../types'

interface HistoryPanelProps {
  pageId: string
  onClose: () => void
}

export function HistoryPanel({ pageId, onClose }: HistoryPanelProps) {
  const [entries, setEntries] = useState<CanvasHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.listHistory(pageId).then((data) => {
      setEntries(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [pageId])

  return (
    <div className="absolute top-0 right-0 w-[300px] h-full bg-white border-l border-border flex flex-col z-[200] shadow-lg">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-[13px] font-semibold text-foreground">History</span>
        <IconButton variant="ghost" size="sm" onClick={onClose} title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </IconButton>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {loading ? (
          <div className="text-muted-foreground text-xs text-center py-5">
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-muted-foreground text-xs text-center py-5">
            No history yet. Changes are saved automatically.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="px-3 py-2 bg-secondary rounded-lg border border-border/50 cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <div className="text-xs text-foreground font-medium">
                  {entry.description || 'Canvas snapshot'}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {new Date(entry.created_at).toLocaleString()}
                </div>
                {entry.build_id && (
                  <div className="mt-1 inline-flex items-center gap-1 bg-success/[0.08] text-success rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Build snapshot
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
