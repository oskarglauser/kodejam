import { useState, useCallback, useEffect, useRef } from 'react'
import { Excalidraw, convertToExcalidrawElements } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
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
  const saveRef = useRef<() => void>(() => {})

  const { save } = useCanvasPersistence(excalidrawAPI)
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

      // Trigger persistence via ref (so callback identity never changes)
      saveRef.current()
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
        UIOptions={{
          canvasActions: {
            loadScene: false,
            export: false,
            saveToActiveFile: false,
          },
          tools: {
            image: false,
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
