import { useState } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useProjectStore } from '../stores/projectStore'
import { useNavigate } from 'react-router-dom'
import { ProjectSettingsModal } from '../features/project/ProjectSettingsModal'

export function Toolbar() {
  const { currentProject, updateProject } = useProjectStore()
  const { viewMode, setViewMode, toggleHistory, setChatOpen } = useUIStore()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')

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

        <button
          onClick={() => setChatOpen(true)}
          className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
          title="Open AI Chat"
        >
          Chat
        </button>

        <button
          onClick={toggleHistory}
          className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
        >
          History
        </button>

        {currentProject && (
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded ml-1"
          >
            Settings
          </button>
        )}
      </header>

      {showSettings && <ProjectSettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
