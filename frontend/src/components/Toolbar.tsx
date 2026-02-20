import { useState, useEffect } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useProjectStore } from '../stores/projectStore'
import { useNavigate } from 'react-router-dom'
import { ProjectSettingsModal } from '../features/project/ProjectSettingsModal'
import type { ExcalidrawImperativeAPI } from '../canvas/Canvas'

interface ToolbarProps {
  excalidrawAPI?: ExcalidrawImperativeAPI | null
}

export function Toolbar({ excalidrawAPI }: ToolbarProps) {
  const { currentProject, updateProject } = useProjectStore()
  const { viewMode, setViewMode, chatOpen, toggleChat, historyOpen, toggleHistory, showSettings, setShowSettings } = useUIStore()
  const navigate = useNavigate()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [zoomLevel, setZoomLevel] = useState(100)

  // Track zoom level from Excalidraw
  useEffect(() => {
    if (!excalidrawAPI) return
    const unsub = excalidrawAPI.onChange((_elements, appState) => {
      const pct = Math.round(appState.zoom.value * 100)
      setZoomLevel((prev) => (prev === pct ? prev : pct))
    })
    return unsub
  }, [excalidrawAPI])

  const startRename = () => {
    if (!currentProject) return
    setRenameValue(currentProject.name)
    setIsRenaming(true)
  }

  const handleRename = async () => {
    if (!currentProject || !renameValue.trim()) {
      setIsRenaming(false)
      return
    }
    await updateProject(currentProject.id, { name: renameValue.trim() })
    setIsRenaming(false)
  }

  return (
    <>
      <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-gray-600 mr-3"
        >
          &larr;
        </button>

        {isRenaming ? (
          <input
            autoFocus
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setIsRenaming(false)
            }}
            onBlur={handleRename}
            className="text-sm font-semibold text-gray-800 mr-4 px-1 py-0.5 border border-blue-400 rounded focus:outline-none bg-white"
          />
        ) : (
          <h1
            className="text-sm font-semibold text-gray-800 mr-4 cursor-pointer hover:text-blue-600"
            onDoubleClick={startRename}
            title="Double-click to rename"
          >
            {currentProject?.name ?? 'Kodejam'}
          </h1>
        )}

        <div className="flex-1" />

        {/* Zoom controls */}
        {excalidrawAPI && (
          <div className="flex items-center gap-0.5 mr-3">
            <button
              onClick={() => {
                const s = excalidrawAPI.getAppState()
                const next = Math.max(0.1, s.zoom.value - 0.1)
                excalidrawAPI.updateScene({ appState: { zoom: { value: next as any } } })
              }}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded text-sm"
              title="Zoom out"
            >
              &minus;
            </button>
            <button
              onClick={() => {
                excalidrawAPI.updateScene({ appState: { zoom: { value: 1 as any } } })
              }}
              className="px-1.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded min-w-[3rem] text-center"
              title="Reset zoom"
            >
              {zoomLevel}%
            </button>
            <button
              onClick={() => {
                const s = excalidrawAPI.getAppState()
                const next = Math.min(10, s.zoom.value + 0.1)
                excalidrawAPI.updateScene({ appState: { zoom: { value: next as any } } })
              }}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded text-sm"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => {
                excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements() as any, { fitToContent: true })
              }}
              className="ml-1 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
              title="Zoom to fit"
            >
              Fit
            </button>
          </div>
        )}

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5 mr-3">
          <button
            onClick={() => setViewMode('sketch')}
            className={`px-2.5 py-1 text-xs rounded ${
              viewMode === 'sketch' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
            }`}
          >
            Sketch
          </button>
          <button
            onClick={() => setViewMode('built')}
            className={`px-2.5 py-1 text-xs rounded ${
              viewMode === 'built' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
            }`}
          >
            Built
          </button>
        </div>

        {/* Right-side icon buttons: History, Settings, Chat */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleHistory}
            className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 ${historyOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
            title="History"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>

          {currentProject && (
            <button
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 flex items-center justify-center text-gray-500 rounded hover:bg-gray-100"
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          )}

          <button
            onClick={toggleChat}
            className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 ${chatOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
            title={chatOpen ? 'Hide Chat' : 'Show Chat'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </header>

      {showSettings && <ProjectSettingsModal onClose={() => setShowSettings(false)} excalidrawAPI={excalidrawAPI} />}
    </>
  )
}
