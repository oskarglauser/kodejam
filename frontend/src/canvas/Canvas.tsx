import { useState, useCallback, useMemo, useEffect } from 'react'
import { Tldraw, useEditor, useValue, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { useCanvasPersistence } from './hooks/useCanvasPersistence'
import { WireframeBoxUtil } from './shapes/WireframeBoxUtil'
import { StickyNoteUtil } from './shapes/StickyNoteUtil'
import { ScreenshotUtil } from './shapes/ScreenshotUtil'
import { WireframeBoxTool } from './tools/WireframeBoxTool'
import { StickyNoteTool } from './tools/StickyNoteTool'
import { CustomToolbar } from './ui/CustomToolbar'
import { ViewToggle } from './ui/ViewToggle'
import { BuildButton } from './ui/BuildButton'

const customShapeUtils = [WireframeBoxUtil, StickyNoteUtil, ScreenshotUtil]
const customTools = [WireframeBoxTool, StickyNoteTool]

interface CanvasProps {
  onBuild?: (shapes: Array<{ id: string; type: string; label: string; description?: string }>) => void
  onSelectionChange?: (shapes: Array<{ id: string; type: string; label: string; description?: string }>) => void
  onChatOpen?: () => void
}

function CanvasInner({ onBuild, onSelectionChange, onChatOpen }: CanvasProps) {
  const editor = useEditor()
  useCanvasPersistence(editor)

  const selectedIds = useValue('selection', () => editor.getSelectedShapeIds(), [editor])

  // Extract shape info for selected shapes
  useEffect(() => {
    if (!onSelectionChange) return
    const shapes = selectedIds.map((id) => {
      const shape = editor.getShape(id)
      if (!shape) return null
      const props = shape.props as any
      return {
        id: id as string,
        type: shape.type,
        label: props.label ?? props.text ?? shape.type,
        description: props.description,
      }
    }).filter(Boolean) as Array<{ id: string; type: string; label: string; description?: string }>
    onSelectionChange(shapes)
  }, [editor, selectedIds, onSelectionChange])

  const handleBuild = useCallback(
    (shapeIds: string[]) => {
      if (!onBuild) return
      const shapes = shapeIds.map((id) => {
        const shape = editor.getShape(id as any)
        if (!shape) return null
        const props = shape.props as any
        return {
          id,
          type: shape.type,
          label: props.label ?? props.text ?? shape.type,
          description: props.description,
        }
      }).filter(Boolean) as Array<{ id: string; type: string; label: string; description?: string }>
      onBuild(shapes)
    },
    [editor, onBuild]
  )

  // Keyboard shortcut for chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && onChatOpen) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
        e.preventDefault()
        onChatOpen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onChatOpen])

  return (
    <>
      <CustomToolbar />
      <BuildButton onBuild={handleBuild} />
      <ViewToggle />
    </>
  )
}

export function Canvas(props: CanvasProps) {
  const overrides = useMemo(
    () => ({
      actions(_editor: Editor, actions: any) {
        return actions
      },
      tools(_editor: Editor, tools: any) {
        tools['wireframe-box'] = {
          id: 'wireframe-box',
          icon: 'rectangle',
          label: 'Wireframe Box',
          kbd: 'b',
          onSelect() {
            _editor.setCurrentTool('wireframe-box')
          },
        }
        tools['sticky-note'] = {
          id: 'sticky-note',
          icon: 'note',
          label: 'Sticky Note',
          kbd: 'n',
          onSelect() {
            _editor.setCurrentTool('sticky-note')
          },
        }
        return tools
      },
    }),
    []
  )

  return (
    <div className="w-full h-full relative">
      <Tldraw
        shapeUtils={customShapeUtils}
        tools={customTools}
        overrides={overrides}
        hideUi
      >
        <CanvasInner {...props} />
      </Tldraw>
    </div>
  )
}
