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
      className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-5 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg shadow-[0_2px_8px_rgba(37,99,235,0.3)] z-[100] border-none cursor-pointer hover:bg-primary/90"
    >
      <span className="text-sm">&#9654;</span>
      Build ({selectedIds.length})
    </button>
  )
}
