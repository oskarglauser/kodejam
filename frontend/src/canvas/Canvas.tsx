import { useState, useCallback, useEffect, useRef } from 'react'
import { Excalidraw, convertToExcalidrawElements, getDataURL } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles, BinaryFileData, DataURL } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement, FileId } from '@excalidraw/excalidraw/element/types'
import '@excalidraw/excalidraw/index.css'
import { useCanvasPersistence } from './hooks/useCanvasPersistence'
import { CustomToolbar } from './ui/CustomToolbar'
import { ViewToggle } from './ui/ViewToggle'
import { BuildButton } from './ui/BuildButton'

export type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'

interface CanvasProps {
  onBuild?: (shapes: Array<{ id: string; type: string; label: string; description?: string; imageUrl?: string }>) => void
  onSelectionChange?: (shapes: Array<{ id: string; type: string; label: string; description?: string; imageUrl?: string }>) => void
  onChatOpen?: () => void
  onEditorMount?: (api: ExcalidrawImperativeAPI) => void
  canvasColor?: string
}

function extractShapeInfo(element: ExcalidrawElement): { id: string; type: string; label: string; description?: string; imageUrl?: string } {
  const customData = (element as any).customData as Record<string, any> | undefined
  const kodejamType = customData?.kodejam ?? element.type
  const label = customData?.label ?? (element.type === 'text' ? (element as any).text : kodejamType)
  const description = customData?.description
  const imageUrl = customData?.imageUrl
  return { id: element.id, type: kodejamType, label, description, imageUrl }
}

export function Canvas({ onBuild, onSelectionChange, onChatOpen, onEditorMount, canvasColor }: CanvasProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null)
  const [activeTool, setActiveTool] = useState('selection')
  const prevSelectedIdsRef = useRef<string>('')
  const prevToolRef = useRef<string>('selection')

  // Use refs for callbacks to keep the onChange reference stable
  const onSelectionChangeRef = useRef(onSelectionChange)
  onSelectionChangeRef.current = onSelectionChange
  const saveRef = useRef<(elements: readonly ExcalidrawElement[]) => void>(() => {})

  const { save, initialData: persistedData } = useCanvasPersistence(excalidrawAPI)
  saveRef.current = save

  // Notify parent when API is ready
  useEffect(() => {
    if (excalidrawAPI && onEditorMount) {
      onEditorMount(excalidrawAPI)
    }
  }, [excalidrawAPI, onEditorMount])

  // Stable onChange handler — never changes reference
  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, _files: BinaryFiles) => {
      const toolType = appState.activeTool.type
      if (toolType !== prevToolRef.current) {
        prevToolRef.current = toolType
        setActiveTool(toolType)
      }

      // Track selection
      const selectedIds = Object.keys(appState.selectedElementIds || {})
      const selectedKey = selectedIds.sort().join(',')
      if (selectedKey !== prevSelectedIdsRef.current) {
        prevSelectedIdsRef.current = selectedKey
        if (onSelectionChangeRef.current) {
          const shapes = selectedIds
            .map((id) => {
              const el = elements.find((e) => e.id === id)
              return el ? extractShapeInfo(el) : null
            })
            .filter(Boolean) as Array<{ id: string; type: string; label: string; description?: string; imageUrl?: string }>
          onSelectionChangeRef.current(shapes)
        }
      }

      // Trigger persistence via ref — pass elements directly from onChange
      saveRef.current(elements)
    },
    [] // no deps — uses refs for everything that changes
  )

  const handleBuild = useCallback(
    (elementIds: string[]) => {
      if (!onBuild || !excalidrawAPI) return
      const elements = excalidrawAPI.getSceneElements()
      const shapes = elementIds
        .map((id) => {
          const el = elements.find((e) => e.id === id)
          return el ? extractShapeInfo(el) : null
        })
        .filter(Boolean) as Array<{ id: string; type: string; label: string; description?: string; imageUrl?: string }>
      onBuild(shapes)
    },
    [excalidrawAPI, onBuild]
  )

  // Handle image paste — scale down by devicePixelRatio for Retina displays
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null)
  excalidrawAPIRef.current = excalidrawAPI

  const handlePaste = useCallback(
    async (data: { files?: BinaryFiles }, event: ClipboardEvent | null) => {
      if (!event) return true

      const items = event.clipboardData?.items
      if (!items) return true

      // Find an image item in the clipboard
      let imageFile: File | null = null
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          imageFile = item.getAsFile()
          break
        }
      }
      if (!imageFile) return true // let Excalidraw handle non-image pastes

      const api = excalidrawAPIRef.current
      if (!api) return true

      // Load image to get natural dimensions
      const dataUrl = await getDataURL(imageFile) as DataURL
      const img = new Image()
      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.src = dataUrl
      })

      const dpr = window.devicePixelRatio || 1
      const width = img.naturalWidth / dpr
      const height = img.naturalHeight / dpr

      // Place at viewport center
      const appState = api.getAppState()
      const cx = (-appState.scrollX + appState.width / 2) / appState.zoom.value - width / 2
      const cy = (-appState.scrollY + appState.height / 2) / appState.zoom.value - height / 2

      const fileId = `pasted-${Date.now()}` as FileId
      const fileData: BinaryFileData = {
        mimeType: imageFile.type as BinaryFileData['mimeType'],
        id: fileId,
        dataURL: dataUrl,
        created: Date.now(),
      }
      api.addFiles([fileData])

      const elements = convertToExcalidrawElements([
        {
          type: 'image' as const,
          x: cx,
          y: cy,
          width,
          height,
          fileId,
        },
      ])
      api.updateScene({ elements: [...api.getSceneElements(), ...elements] })

      return false // prevent Excalidraw's default paste handling
    },
    []
  )

  // Keyboard shortcuts for chat (/) and custom tools (B, N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      if (e.key === '/' && !e.ctrlKey && !e.metaKey && onChatOpen) {
        e.preventDefault()
        onChatOpen()
      }

      if (!excalidrawAPI) return

      if (e.key === 'b' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        createWireframeBox(excalidrawAPI)
      }

      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        createStickyNote(excalidrawAPI)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onChatOpen, excalidrawAPI])

  const containerStyle = canvasColor
    ? { '--kodejam-canvas-bg': canvasColor } as React.CSSProperties
    : undefined

  return (
    <div className="absolute inset-0" style={containerStyle}>
      <Excalidraw
        excalidrawAPI={setExcalidrawAPI}
        onChange={handleChange}
        onPaste={handlePaste}
        initialData={{
          elements: persistedData?.elements,
          files: persistedData?.files,
          appState: { viewBackgroundColor: canvasColor || '#f5f5f4' },
        }}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            export: false,
            saveToActiveFile: false,
          },
        }}
        theme="light"
      >
        <CustomToolbar excalidrawAPI={excalidrawAPI} activeTool={activeTool} />
        <BuildButton excalidrawAPI={excalidrawAPI} onBuild={handleBuild} />
        <ViewToggle excalidrawAPI={excalidrawAPI} />
      </Excalidraw>
    </div>
  )
}

// Helper: create a wireframe box (dashed rectangle + text) at viewport center
export function createWireframeBox(api: ExcalidrawImperativeAPI, opts?: { x?: number; y?: number; label?: string }) {
  const appState = api.getAppState()
  const centerX = opts?.x ?? (-appState.scrollX + appState.width / 2) / appState.zoom.value - 100
  const centerY = opts?.y ?? (-appState.scrollY + appState.height / 2) / appState.zoom.value - 75
  const label = opts?.label ?? 'Component'

  const rectId = `wireframe-${Date.now()}`

  const elements = convertToExcalidrawElements([
    {
      type: 'rectangle',
      id: rectId,
      x: centerX,
      y: centerY,
      width: 200,
      height: 150,
      strokeStyle: 'dashed',
      strokeColor: '#94a3b8',
      backgroundColor: '#f8fafc',
      fillStyle: 'solid',
      customData: { kodejam: 'wireframe-box', label, description: '', buildStatus: 'sketch' },
      label: {
        text: label,
        fontSize: 16,
      },
    },
  ])

  api.updateScene({ elements: [...api.getSceneElements(), ...elements] })
}

// Helper: create a sticky note (yellow rectangle + text) at viewport center
export function createStickyNote(api: ExcalidrawImperativeAPI, opts?: { x?: number; y?: number; text?: string }) {
  const appState = api.getAppState()
  const centerX = opts?.x ?? (-appState.scrollX + appState.width / 2) / appState.zoom.value - 75
  const centerY = opts?.y ?? (-appState.scrollY + appState.height / 2) / appState.zoom.value - 75

  const elements = convertToExcalidrawElements([
    {
      type: 'rectangle',
      x: centerX,
      y: centerY,
      width: 150,
      height: 150,
      backgroundColor: '#fef3c7',
      strokeColor: '#f59e0b',
      fillStyle: 'solid',
      customData: { kodejam: 'sticky-note' },
      label: {
        text: opts?.text ?? 'Note',
        fontSize: 14,
      },
    },
  ])

  api.updateScene({ elements: [...api.getSceneElements(), ...elements] })
}
