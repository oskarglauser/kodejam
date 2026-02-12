import { useState, useEffect } from 'react'
import type { Editor, TLShapeId } from 'tldraw'

export function useCanvasSelection(editor: Editor | null) {
  const [selectedIds, setSelectedIds] = useState<TLShapeId[]>([])

  useEffect(() => {
    if (!editor) return
    const handleChange = () => {
      setSelectedIds([...editor.getSelectedShapeIds()])
    }
    // Listen to selection changes
    const unsub = editor.store.listen(handleChange, { source: 'user', scope: 'session' })
    return unsub
  }, [editor])

  return { selectedIds, hasSelection: selectedIds.length > 0 }
}
