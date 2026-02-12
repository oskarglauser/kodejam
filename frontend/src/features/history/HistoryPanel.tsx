import { useState, useEffect } from 'react'
import { api } from '../../services/api'
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
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 280,
        height: '100%',
        background: 'white',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>History</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#94a3b8',
            fontSize: 16,
          }}
        >
          x
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {loading ? (
          <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 20 }}>
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 20 }}>
            No history yet. Changes are saved automatically.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: '8px 12px',
                  background: '#f8fafc',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 12, color: '#1e293b', fontWeight: 500 }}>
                  {entry.description || 'Canvas snapshot'}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {new Date(entry.created_at).toLocaleString()}
                </div>
                {entry.build_id && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 10,
                      color: '#22c55e',
                      fontWeight: 500,
                    }}
                  >
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
