import { useState, useEffect } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useProjectStore } from '../stores/projectStore'
import { useNavigate } from 'react-router-dom'
import { ProjectSettingsModal } from '../features/project/ProjectSettingsModal'
import { HelpModal } from './HelpModal'
import { IconButton } from './ui/icon-button'
import type { ExcalidrawImperativeAPI } from '../canvas/Canvas'

interface ToolbarProps {
  excalidrawAPI?: ExcalidrawImperativeAPI | null
}

export function Toolbar({ excalidrawAPI }: ToolbarProps) {
  const { currentProject, updateProject } = useProjectStore()
  const { chatOpen, toggleChat, historyOpen, toggleHistory, showSettings, setShowSettings } = useUIStore()
  const navigate = useNavigate()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [showHelp, setShowHelp] = useState(false)

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
      <header className="h-12 bg-white border-b border-border flex items-center px-4 shrink-0 shadow-sm">
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mr-3"
          title="Back to projects"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
        </IconButton>

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
            className="text-[13px] font-semibold text-foreground mr-4 px-1 py-0.5 border border-primary rounded-md focus:outline-none bg-white"
          />
        ) : (
          <h1
            className="text-[13px] font-semibold text-foreground mr-4 cursor-pointer hover:text-primary transition-colors"
            onDoubleClick={startRename}
            title="Double-click to rename"
          >
            {currentProject?.name ?? 'Kodejam'}
          </h1>
        )}

        <div className="flex-1" />

        {/* Zoom controls */}
        {excalidrawAPI && (
          <div className="flex items-center bg-secondary rounded-lg p-0.5 mr-3">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => {
                const s = excalidrawAPI.getAppState()
                const next = Math.max(0.1, s.zoom.value - 0.1)
                excalidrawAPI.updateScene({ appState: { zoom: { value: next as any } } })
              }}
              title="Zoom out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
              </svg>
            </IconButton>
            <button
              onClick={() => {
                excalidrawAPI.updateScene({ appState: { zoom: { value: 1 as any } } })
              }}
              className="px-1.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground rounded min-w-[3rem] text-center transition-colors"
              title="Reset zoom"
            >
              {zoomLevel}%
            </button>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => {
                const s = excalidrawAPI.getAppState()
                const next = Math.min(10, s.zoom.value + 0.1)
                excalidrawAPI.updateScene({ appState: { zoom: { value: next as any } } })
              }}
              title="Zoom in"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
            </IconButton>
            <div className="w-px h-4 bg-border mx-0.5" />
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => {
                excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements() as any, { fitToContent: true })
              }}
              title="Zoom to fit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6" />
                <path d="M9 21H3v-6" />
                <path d="M21 3l-7 7" />
                <path d="M3 21l7-7" />
              </svg>
            </IconButton>
          </div>
        )}

        {/* Right-side icon buttons: History, Help, Settings, Chat */}
        <div className="flex items-center gap-1">
          <IconButton
            variant={historyOpen ? 'active' : 'ghost'}
            onClick={toggleHistory}
            title="History"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </IconButton>

          <IconButton
            variant="ghost"
            onClick={() => setShowHelp(true)}
            title="Help"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </IconButton>

          {currentProject && (
            <IconButton
              variant="ghost"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </IconButton>
          )}

          <IconButton
            variant={chatOpen ? 'active' : 'ghost'}
            onClick={toggleChat}
            title={chatOpen ? 'Hide Chat' : 'Show Chat'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </IconButton>
        </div>
      </header>

      {showSettings && <ProjectSettingsModal onClose={() => setShowSettings(false)} excalidrawAPI={excalidrawAPI} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </>
  )
}
