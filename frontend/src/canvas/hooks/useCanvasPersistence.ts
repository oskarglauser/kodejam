import { useCallback, useEffect, useRef } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
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
  const isLoadingRef = useRef(false)

  // Load snapshot when page changes
  useEffect(() => {
    if (!excalidrawAPI || !currentPage) return
    if (currentPage.canvas_snapshot) {
      try {
        isLoadingRef.current = true
        const snapshot = JSON.parse(currentPage.canvas_snapshot)
        if (snapshot.version === 2 && snapshot.type === 'excalidraw') {
          excalidrawAPI.updateScene({ elements: snapshot.elements })
          if (snapshot.files && Object.keys(snapshot.files).length > 0) {
            excalidrawAPI.addFiles(Object.values(snapshot.files))
          }
        }
      } catch (e) {
        console.warn('Failed to load canvas snapshot:', e)
      } finally {
        setTimeout(() => {
          isLoadingRef.current = false
        }, 200)
      }
    } else {
      isLoadingRef.current = true
      // Clear canvas for new pages
      excalidrawAPI.updateScene({ elements: [] })
      setTimeout(() => {
        isLoadingRef.current = false
      }, 200)
    }
  }, [excalidrawAPI, currentPage?.id])

  // Create snapshot from current state
  const getSnapshot = useCallback((): string | null => {
    if (!excalidrawAPI) return null
    const elements = excalidrawAPI.getSceneElements()
    const files = excalidrawAPI.getFiles()
    const snapshot: ExcalidrawSnapshot = {
      version: 2,
      type: 'excalidraw',
      elements: [...elements],
      files: files ?? {},
    }
    return JSON.stringify(snapshot)
  }, [excalidrawAPI])

  // Debounced save
  const save = useCallback(() => {
    if (!excalidrawAPI || !currentPage || isLoadingRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const snapshotStr = getSnapshot()
      if (snapshotStr) {
        updatePage(currentPage.id, { canvas_snapshot: snapshotStr })
      }
    }, 1000)
  }, [excalidrawAPI, currentPage, updatePage, getSnapshot])

  // Auto-save history every 5 minutes of activity
  const saveHistory = useCallback(() => {
    if (!excalidrawAPI || !currentPage || isLoadingRef.current) return
    if (historyTimer.current) clearTimeout(historyTimer.current)
    historyTimer.current = setTimeout(() => {
      const snapshotStr = getSnapshot()
      if (snapshotStr) {
        api.createHistoryEntry(currentPage.id, {
          snapshot: snapshotStr,
          description: 'Auto-save',
        }).catch(() => {})
      }
    }, 5 * 60 * 1000)
  }, [excalidrawAPI, currentPage, getSnapshot])

  // Trigger history save on each save
  useEffect(() => {
    return () => {
      if (historyTimer.current) clearTimeout(historyTimer.current)
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  return {
    save: useCallback(() => {
      save()
      saveHistory()
    }, [save, saveHistory]),
  }
}
