import { useState, useEffect } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'

interface BuildButtonProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null
  onBuild: (elementIds: string[]) => void
}

export function BuildButton({ excalidrawAPI, onBuild }: BuildButtonProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (!excalidrawAPI) return
    const unsub = excalidrawAPI.onChange((_elements, appState) => {
      const ids = Object.keys(appState.selectedElementIds || {})
      setSelectedIds(ids)
    })
    return unsub
  }, [excalidrawAPI])

  if (selectedIds.length === 0) return null

  return (
    <button
      onClick={() => onBuild(selectedIds)}
      style={{
        position: 'absolute',
        bottom: 64,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 20px',
        fontSize: 13,
        fontWeight: 600,
        color: 'white',
        background: '#2563eb',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 14 }}>&#9654;</span>
      Build ({selectedIds.length})
    </button>
  )
}
