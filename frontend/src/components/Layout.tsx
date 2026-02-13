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
      const draft = `Build the following from my design:\n${shapeList}\n\nPlease implement these components/changes.`
      setBuildDraftMessage(draft)
      setChatOpen(true)
    },
    [currentProject, currentPage, setChatOpen]
  )

  const handleScreenshotsStart = useCallback(() => {
    screenshotFlowRef.current = null
  }, [])

  const handleCreateScreenshot = useCallback(
    async (imageUrl: string, description: string, _filePath?: string) => {
      const api = apiRef.current
      if (!api) return

      const shapeW = 640
      const shapeH = 400
      const gap = 160

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

      const flow = screenshotFlowRef.current
      const x = flow.nextX
      const y = flow.baseY

      // Fetch image and convert to dataURL for Excalidraw
      let dataUrl: DataURL
      try {
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        dataUrl = await getDataURL(blob) as DataURL
      } catch (e) {
        console.warn('Failed to fetch screenshot image:', e)
        return
      }

      const fileId = `screenshot-file-${Date.now()}` as FileId
      const shortTitle = `Screen ${flow.elementIds.length + 1}`

      // Add file to Excalidraw
      const fileData: BinaryFileData = {
        mimeType: 'image/png',
        id: fileId,
        dataURL: dataUrl,
        created: Date.now(),
      }
      api.addFiles([fileData])

      // Create image element + description text + arrow
      const screenshotId = `screenshot-${Date.now()}`
      const newElements: any[] = [
        {
          type: 'image' as const,
          id: screenshotId,
          x,
          y,
          width: shapeW,
          height: shapeH,
          fileId,
          customData: {
            kodejam: 'screenshot',
            description: shortTitle,
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
      ]

      if (flow.elementIds.length > 0) {
        newElements.push({
          type: 'arrow' as const,
          x: x - gap + 20,
          y: y + shapeH / 2,
          width: gap - 40,
          height: 0,
          points: [[0, 0], [gap - 40, 0]] as any,
        })
      }

      const elements = convertToExcalidrawElements(newElements)
      api.updateScene({ elements: [...api.getSceneElements(), ...elements] })

      flow.elementIds.push(screenshotId)
      flow.nextX = x + shapeW + gap

      setTimeout(() => {
        api.scrollToContent(api.getSceneElements() as any, { fitToContent: true })
      }, 100)
    },
    []
  )

  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
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

          {/* Chat Panel */}
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
            />
          )}

          {/* History Panel */}
          {historyOpen && currentPage && (
            <HistoryPanel pageId={currentPage.id} onClose={toggleHistory} />
          )}
        </main>
      </div>
    </div>
  )
}
