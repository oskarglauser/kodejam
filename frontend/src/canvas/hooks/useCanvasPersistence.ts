import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import { useProjectStore } from '../../stores/projectStore'
import { api } from '../../services/api'

interface ExcalidrawSnapshot {
  version: 2
  type: 'excalidraw'
  elements: any[]
  files: Record<string, any>
}

export function useCanvasPersistence(excalidrawAPI: ExcalidrawImperativeAPI | null) {
  const currentPage = useProjectStore((s) => s.currentPage)
  const updatePage = useProjectStore((s) => s.updatePage)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const historyTimer = useRef<ReturnType<typeof setTimeout>>()
  // Block saves until the first onChange fires (signals initialData is rendered)
  const readyRef = useRef(false)
  // Track whether we have unsaved changes
  const dirtyRef = useRef(false)
  // Cache elements from onChange — the authoritative source
  const latestElementsRef = useRef<readonly ExcalidrawElement[]>([])

  // Compute initialData from snapshot — passed to <Excalidraw initialData={...}>
  // This avoids the updateScene vs initialData race condition entirely.
  const initialData = useMemo(() => {
    // Reset state for the new page
    readyRef.current = false
    dirtyRef.current = false
    latestElementsRef.current = []

    if (!currentPage?.canvas_snapshot) return undefined
    try {
      const snapshot = JSON.parse(currentPage.canvas_snapshot)
      if (snapshot.version === 2 && snapshot.type === 'excalidraw') {
        latestElementsRef.current = snapshot.elements || []
        return { elements: snapshot.elements, files: snapshot.files || {} }
      }
    } catch (e) {
      console.warn('Failed to parse canvas snapshot:', e)
    }
    return undefined
  }, [currentPage?.id])

  // Stable page ID ref for use in debounced timer callbacks
  const pageIdRef = useRef(currentPage?.id)
  pageIdRef.current = currentPage?.id

  // Refs for beforeunload access
  const excalidrawAPIRef = useRef(excalidrawAPI)
  excalidrawAPIRef.current = excalidrawAPI

  // Stable ref for updatePage to avoid recreating save callback
  const updatePageRef = useRef(updatePage)
  updatePageRef.current = updatePage

  // Build snapshot from latestElementsRef (authoritative, always current)
  const buildSnapshot = useCallback((options?: { skipFiles?: boolean }): string | null => {
    const apiInstance = excalidrawAPIRef.current
    if (!apiInstance) return null
    const elements = latestElementsRef.current
    const files = options?.skipFiles ? {} : (apiInstance.getFiles() ?? {})
    // Safety guard: refuse to save empty elements when files exist
    if (elements.length === 0 && Object.keys(files).length > 0) {
      console.warn('[persistence] Skipping save: empty elements with existing files')
      return null
    }
    const snapshot: ExcalidrawSnapshot = {
      version: 2,
      type: 'excalidraw',
      elements: [...elements],
      files,
    }
    return JSON.stringify(snapshot)
  }, [])

  const buildSnapshotRef = useRef(buildSnapshot)
  buildSnapshotRef.current = buildSnapshot

  // Flush save immediately (used by beforeunload and cleanup)
  const flushSave = useCallback(() => {
    const pageId = pageIdRef.current
    if (!pageId || !readyRef.current || !dirtyRef.current) return
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = undefined
    }
    dirtyRef.current = false
    // Use skipFiles to stay under 64KB keepalive limit
    const snapshotStr = buildSnapshotRef.current({ skipFiles: true })
    if (snapshotStr) {
      // Use keepalive so the request survives page unload
      fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvas_snapshot: snapshotStr }),
        keepalive: true,
      }).catch(() => {})
    }
  }, [])

  // Save before page unload (refresh, close tab, navigate away)
  useEffect(() => {
    const handleBeforeUnload = () => flushSave()
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [flushSave])

  // Debounced save — called from onChange but only schedules when ready
  const save = useCallback(
    (elements: readonly ExcalidrawElement[]) => {
      if (!excalidrawAPIRef.current || !pageIdRef.current) return
      latestElementsRef.current = elements // always cache
      if (!readyRef.current) {
        readyRef.current = true // first onChange = initialData rendered, init done
        return
      }
      dirtyRef.current = true
      // Don't reset timer if one is already running — it will capture latest state via latestElementsRef
      if (saveTimer.current) return
      saveTimer.current = setTimeout(() => {
        saveTimer.current = undefined
        if (!dirtyRef.current) return
        dirtyRef.current = false
        const pageId = pageIdRef.current
        if (!pageId) return
        const snapshotStr = buildSnapshotRef.current()
        if (snapshotStr) {
          updatePageRef.current(pageId, { canvas_snapshot: snapshotStr }).catch((err) => {
            console.warn('[persistence] Save failed:', err)
            dirtyRef.current = true // Mark dirty again so next onChange retries
          })
        }
      }, 1000)
    },
    [] // stable — uses only refs
  )

  // Auto-save history every 5 minutes of activity
  const saveHistory = useCallback(() => {
    if (!excalidrawAPIRef.current || !pageIdRef.current || !readyRef.current) return
    if (historyTimer.current) clearTimeout(historyTimer.current)
    historyTimer.current = setTimeout(() => {
      const pageId = pageIdRef.current
      if (!pageId) return
      const snapshotStr = buildSnapshotRef.current()
      if (snapshotStr) {
        api.createHistoryEntry(pageId, {
          snapshot: snapshotStr,
          description: 'Auto-save',
        }).catch(() => {})
      }
    }, 5 * 60 * 1000)
  }, []) // stable — uses only refs

  useEffect(() => {
    return () => {
      if (historyTimer.current) clearTimeout(historyTimer.current)
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  return {
    save: useCallback(
      (elements: readonly ExcalidrawElement[]) => {
        save(elements)
        saveHistory()
      },
      [save, saveHistory]
    ),
    initialData,
  }
}
