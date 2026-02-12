import { useUIStore } from '../stores/uiStore'
import { useProjectStore } from '../stores/projectStore'
import { useNavigate } from 'react-router-dom'

export function Toolbar() {
  const { currentProject } = useProjectStore()
  const { viewMode, setViewMode, toggleHistory } = useUIStore()
  const navigate = useNavigate()

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 shrink-0">
      <button
        onClick={() => navigate('/')}
        className="text-sm text-gray-400 hover:text-gray-600 mr-3"
      >
        &larr;
      </button>
      <h1 className="text-sm font-semibold text-gray-800 mr-4">
        {currentProject?.name ?? 'Kodejam'}
      </h1>

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
        onClick={toggleHistory}
        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
      >
        History
      </button>
    </header>
  )
}
