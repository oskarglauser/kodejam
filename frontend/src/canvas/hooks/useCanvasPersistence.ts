import { useCallback, useEffect, useRef } from 'react'
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
  // Block saves until the load effect has run and settled
  const readyRef = useRef(false)
  const loadTimerRef = useRef<ReturnType<typeof setTimeout>>()
  // Store latest elements from onChange to use in debounced save
  const latestElementsRef = useRef<readonly ExcalidrawElement[]>([])

  // Load snapshot when page changes
  useEffect(() => {
    readyRef.current = false
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current)

    if (!excalidrawAPI || !currentPage) return

    if (currentPage.canvas_snapshot) {
      try {
        const snapshot = JSON.parse(currentPage.canvas_snapshot)
        if (snapshot.version === 2 && snapshot.type === 'excalidraw') {
          excalidrawAPI.updateScene({ elements: snapshot.elements })
          if (snapshot.files && Object.keys(snapshot.files).length > 0) {
            setTimeout(() => {
              excalidrawAPI.addFiles(Object.values(snapshot.files))
            }, 0)
          }
        }
      } catch (e) {
        console.warn('Failed to load canvas snapshot:', e)
      }
    } else {
      excalidrawAPI.updateScene({ elements: [] })
    }

    // Allow saves after load has settled
    loadTimerRef.current = setTimeout(() => {
      readyRef.current = true
    }, 500)

    return () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current)
    }
  }, [excalidrawAPI, currentPage?.id])

  // Stable page ID ref for use in debounced timer callbacks
  const pageIdRef = useRef(currentPage?.id)
  pageIdRef.current = currentPage?.id

  // Build snapshot from the latest onChange elements
  const buildSnapshot = useCallback((): string | null => {
    if (!excalidrawAPI) return null
    // Use elements captured from onChange — more reliable than re-querying
    const allElements = latestElementsRef.current
    const elements = allElements.filter((el: any) => !el.isDeleted)
    const sceneElements = excalidrawAPI.getSceneElements()
    console.log('[persistence] buildSnapshot:', {
      latestRefCount: allElements.length,
      nonDeletedCount: elements.length,
      sceneElementCount: sceneElements.length,
      deletedCount: allElements.length - elements.length,
    })
    // Use sceneElements as fallback if latestRef is empty but scene has elements
    const finalElements = elements.length > 0 ? elements : sceneElements
    const files = excalidrawAPI.getFiles()
    const snapshot: ExcalidrawSnapshot = {
      version: 2,
      type: 'excalidraw',
      elements: [...finalElements],
      files: files ?? {},
    }
    return JSON.stringify(snapshot)
  }, [excalidrawAPI])

  // Debounced save — called with elements from onChange
  const save = useCallback(
    (elements: readonly ExcalidrawElement[]) => {
      // Store latest elements for the debounced callback
      latestElementsRef.current = elements
      const nonDeleted = elements.filter((el: any) => !el.isDeleted)
      if (nonDeleted.length > 0 || elements.length > 0) {
        console.log('[persistence] save called:', { total: elements.length, nonDeleted: nonDeleted.length, ready: readyRef.current })
      }
      if (!excalidrawAPI || !currentPage || !readyRef.current) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        const pageId = pageIdRef.current
        if (!pageId) return
        const snapshotStr = buildSnapshot()
        if (snapshotStr) {
          updatePage(pageId, { canvas_snapshot: snapshotStr })
        }
      }, 1000)
    },
    [excalidrawAPI, currentPage, updatePage, buildSnapshot]
  )

  // Auto-save history every 5 minutes of activity
  const saveHistory = useCallback(() => {
    if (!excalidrawAPI || !currentPage || !readyRef.current) return
    if (historyTimer.current) clearTimeout(historyTimer.current)
    historyTimer.current = setTimeout(() => {
      const pageId = pageIdRef.current
      if (!pageId) return
      const snapshotStr = buildSnapshot()
      if (snapshotStr) {
        api.createHistoryEntry(pageId, {
          snapshot: snapshotStr,
          description: 'Auto-save',
        }).catch(() => {})
      }
    }, 5 * 60 * 1000)
  }, [excalidrawAPI, currentPage, buildSnapshot])

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
  }
}
