import { useCallback, useEffect, useRef } from 'react'
import type { Editor } from 'tldraw'
import { useProjectStore } from '../../stores/projectStore'

export function useCanvasPersistence(editor: Editor | null) {
  const currentPage = useProjectStore((s) => s.currentPage)
  const updatePage = useProjectStore((s) => s.updatePage)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const isLoadingRef = useRef(false)

  // Load snapshot when page changes
  useEffect(() => {
    if (!editor || !currentPage) return
    if (currentPage.canvas_snapshot) {
      try {
        isLoadingRef.current = true
        const snapshot = JSON.parse(currentPage.canvas_snapshot)
        editor.loadSnapshot(snapshot)
      } catch (e) {
        console.warn('Failed to load canvas snapshot:', e)
      } finally {
        // Delay resetting flag to avoid immediate save trigger
        setTimeout(() => {
          isLoadingRef.current = false
        }, 100)
      }
    } else {
      isLoadingRef.current = true
      // Clear canvas for new pages
      editor.selectAll().deleteShapes(editor.getSelectedShapeIds())
      setTimeout(() => {
        isLoadingRef.current = false
      }, 100)
    }
  }, [editor, currentPage?.id])

  // Debounced save
  const save = useCallback(() => {
    if (!editor || !currentPage || isLoadingRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const snapshot = editor.getSnapshot()
      updatePage(currentPage.id, {
        canvas_snapshot: JSON.stringify(snapshot),
      })
    }, 1000)
  }, [editor, currentPage, updatePage])

  // Listen for store changes
  useEffect(() => {
    if (!editor) return
    const unsub = editor.store.listen(() => {
      if (!isLoadingRef.current) save()
    }, { source: 'user', scope: 'document' })
    return unsub
  }, [editor, save])

  return { save }
}
