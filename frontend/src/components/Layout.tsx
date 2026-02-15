import { useState, useCallback, useRef } from 'react'
import { convertToExcalidrawElements, getDataURL } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI, BinaryFileData, DataURL } from '@excalidraw/excalidraw/types'
import type { FileId } from '@excalidraw/excalidraw/element/types'
import { Sidebar } from './Sidebar'
import { Toolbar } from './Toolbar'
import { Canvas } from '../canvas/Canvas'
import { ChatPanel } from '../features/ai/ChatPanel'
import { useProjectStore } from '../stores/projectStore'
import { useUIStore } from '../stores/uiStore'
import { HistoryPanel } from '../features/history/HistoryPanel'
import type { ProjectSettings } from '../types'

function getProjectSettings(project: { settings: string }): ProjectSettings {
  try {
    return JSON.parse(project.settings) as ProjectSettings
  } catch {
    return {}
  }
}

interface ScreenshotFlowState {
  elementIds: string[]
  nextX: number
  baseY: number
}

export function Layout() {
  const currentPage = useProjectStore((s) => s.currentPage)
  const currentProject = useProjectStore((s) => s.currentProject)
  const { chatOpen, setChatOpen, historyOpen, toggleHistory } = useUIStore()
  const [selectedShapes, setSelectedShapes] = useState<Array<{ id: string; type: string; label: string; description?: string; imageUrl?: string }>>([])
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const screenshotFlowRef = useRef<ScreenshotFlowState | null>(null)
  const [buildDraftMessage, setBuildDraftMessage] = useState('')
  const [chatWidth, setChatWidth] = useState(380)

  const projectSettings = currentProject ? getProjectSettings(currentProject) : {}
  const devUrl = projectSettings.dev_url
  const canvasColor = projectSettings.canvas_color

  const handleEditorMount = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api
  }, [])

  const handleBuild = useCallback(
    (shapes: Array<{ id: string; type: string; label: string; description?: string; imageUrl?: string }>) => {
      if (!currentProject || !currentPage) return
      const shapeList = shapes
        .map((s) => {
          const desc = s.description ? `: ${s.description}` : ''
          return `- ${s.label || s.type}${desc}`
        })
        .join('\n')
      const draft = `Analyze these components from my canvas and create a build plan:\n${shapeList}\n\nRead the codebase first, then create a step-by-step plan for implementing these. Don't make any changes yet — just show me the plan.`
      setBuildDraftMessage(draft)
      setChatOpen(true)
    },
    [currentProject, currentPage, setChatOpen]
  )

  const handleScreenshotsStart = useCallback(() => {
    screenshotFlowRef.current = null
  }, [])

  // Queue for serializing async screenshot creation
  const screenshotQueueRef = useRef<Promise<void>>(Promise.resolve())

  const handleCreateScreenshot = useCallback(
    (imageUrl: string, description: string, _filePath?: string) => {
      const api = apiRef.current
      if (!api) return

      const shapeW = 640
      const shapeH = 400
      const gap = 160

      // Initialize flow layout on first screenshot
      if (!screenshotFlowRef.current) {
        const appState = api.getAppState()
        const startX = (-appState.scrollX + 100) / appState.zoom.value
        const startY = (-appState.scrollY + appState.height / 2) / appState.zoom.value - shapeH / 2
        screenshotFlowRef.current = {
          elementIds: [],
          nextX: startX,
          baseY: startY,
        }
      }

      // Reserve position synchronously before any async work
      const flow = screenshotFlowRef.current
      const x = flow.nextX
      const y = flow.baseY
      const index = flow.elementIds.length
      const placeholderId = `placeholder-${Date.now()}-${index}`
      const fileId = `screenshot-file-${Date.now()}-${index}` as FileId

      // Advance position immediately so next call gets the right spot
      flow.elementIds.push(placeholderId)
      flow.nextX = x + shapeW + gap

      // Place placeholder rectangle + arrow immediately
      const placeholderSkeleton: any[] = [
        {
          type: 'rectangle' as const,
          id: placeholderId,
          x,
          y,
          width: shapeW,
          height: shapeH,
          backgroundColor: '#f1f5f9',
          strokeColor: '#cbd5e1',
          fillStyle: 'solid',
          strokeStyle: 'dashed',
          customData: { kodejam: 'screenshot-placeholder' },
          label: { text: 'Loading screenshot...', fontSize: 14 },
        },
      ]

      if (index > 0) {
        placeholderSkeleton.push({
          type: 'arrow' as const,
          x: x - gap + 20,
          y: y + shapeH / 2,
          width: gap - 40,
          height: 0,
          points: [[0, 0], [gap - 40, 0]] as any,
        })
      }

      const placeholderElements = convertToExcalidrawElements(placeholderSkeleton, { regenerateIds: false })
      api.updateScene({
        elements: [...api.getSceneElements(), ...placeholderElements],
      })
      api.scrollToContent(api.getSceneElements() as any, { fitToContent: true })

      // Chain async work to preserve order
      screenshotQueueRef.current = screenshotQueueRef.current.then(async () => {
        // Fetch image and convert to dataURL for Excalidraw
        let dataUrl: DataURL
        try {
          const response = await fetch(imageUrl)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const blob = await response.blob()
          dataUrl = await getDataURL(blob) as DataURL
        } catch (e) {
          console.warn('Failed to fetch screenshot image:', e)
          return
        }

        // Replace placeholder with actual image + description text
        const existingElements = api.getSceneElements()
        const withoutPlaceholder = existingElements.filter(
          (el) => el.id !== placeholderId
        )

        const imageElements = convertToExcalidrawElements([
          {
            type: 'image' as const,
            x,
            y,
            width: shapeW,
            height: shapeH,
            fileId,
            status: 'saved',
            customData: {
              kodejam: 'screenshot',
              description: `Screen ${index + 1}`,
              buildId: '',
              timestamp: new Date().toISOString(),
              imageUrl,
            },
          },
          {
            type: 'text' as const,
            x: x + 10,
            y: y + shapeH + 12,
            text: description,
            fontSize: 14,
          },
        ])

        const fileData = {
          mimeType: 'image/png',
          id: fileId,
          dataURL: dataUrl,
          created: Date.now(),
        } as BinaryFileData

        // Add elements to scene first, then add files.
        // Use setTimeout to ensure the scene update has been flushed
        // before addFiles scans for uncached image elements.
        api.updateScene({
          elements: [...withoutPlaceholder, ...imageElements],
        })
        setTimeout(() => {
          api.addFiles([fileData])
        }, 0)

        setTimeout(() => {
          api.scrollToContent(api.getSceneElements() as any, { fitToContent: true })
        }, 100)
      })
    },
    []
  )

  return (
    <div className="flex flex-col h-screen">
      <Toolbar excalidrawAPI={apiRef.current} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative">
          {currentPage ? (
            <Canvas
              key={currentPage.id}
              onBuild={handleBuild}
              onSelectionChange={setSelectedShapes}
              onChatOpen={() => setChatOpen(true)}
              onEditorMount={handleEditorMount}
              canvasColor={canvasColor}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Create or select a page to start
            </div>
          )}

          {/* History Panel */}
          {historyOpen && currentPage && (
            <HistoryPanel pageId={currentPage.id} onClose={toggleHistory} />
          )}
        </main>

        {/* Chat Panel — inline beside canvas */}
        {chatOpen && currentProject && currentPage && (
          <ChatPanel
            selectedShapes={selectedShapes}
            repoPath={currentProject.repo_path}
            pageName={currentPage.name}
            pageId={currentPage.id}
            devUrl={devUrl}
            onClose={() => setChatOpen(false)}
            onCreateScreenshot={handleCreateScreenshot}
            onScreenshotsStart={handleScreenshotsStart}
            initialMessage={buildDraftMessage}
            onInitialMessageConsumed={() => setBuildDraftMessage('')}
            width={chatWidth}
            onWidthChange={setChatWidth}
          />
        )}
      </div>
    </div>
  )
}
