import { useState } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { api } from '../services/api'

interface SidebarProps {
  onFetchScreenshot?: (pageName: string) => void
}

export function Sidebar({ onFetchScreenshot }: SidebarProps) {
  const { pages, currentPage, currentProject, setCurrentPage, createPage, deletePage, updatePage } = useProjectStore()
  const [newPageName, setNewPageName] = useState('')
  const [adding, setAdding] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [scanning, setScanning] = useState(false)

  const handleAddPage = async () => {
    if (!newPageName.trim()) return
    const page = await createPage(newPageName.trim())
    setCurrentPage(page)
    setNewPageName('')
    setAdding(false)
  }

  const startRename = (pageId: string, currentName: string) => {
    setRenamingId(pageId)
    setRenameValue(currentName)
  }

  const handleRename = async () => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null)
      return
    }
    await updatePage(renamingId, { name: renameValue.trim() })
    setRenamingId(null)
  }

  const handleScanViews = async () => {
    if (!currentProject || scanning) return
    setScanning(true)
    try {
      const { views } = await api.scanViews(currentProject.id)
      const existingNames = new Set(pages.map((p) => p.name.toLowerCase()))
      for (const view of views) {
        if (!existingNames.has(view.name.toLowerCase())) {
          await createPage(view.name)
          existingNames.add(view.name.toLowerCase())
        }
      }
    } catch (err) {
      console.error('Scan views failed:', err)
    } finally {
      setScanning(false)
    }
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Pages</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleScanViews}
            disabled={scanning || !currentProject}
            className="text-gray-400 hover:text-blue-600 text-xs px-1.5 py-0.5 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Scan codebase for views and flows"
          >
            {scanning ? (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setAdding(!adding)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            title="Add page"
          >
            +
          </button>
        </div>
      </div>

      {scanning && (
        <div className="px-3 py-2 border-b border-gray-100 bg-blue-50">
          <p className="text-xs text-blue-600">Scanning codebase for views...</p>
        </div>
      )}

      {adding && (
        <div className="p-2 border-b border-gray-100">
          <input
            autoFocus
            type="text"
            placeholder="Page name..."
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddPage()
              if (e.key === 'Escape') setAdding(false)
            }}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400"
          />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`group flex items-center px-3 py-2 text-sm cursor-pointer ${
              currentPage?.id === page.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setCurrentPage(page)}
            onDoubleClick={() => startRename(page.id, page.name)}
          >
            {renamingId === page.id ? (
              <input
                autoFocus
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename()
                  if (e.key === 'Escape') setRenamingId(null)
                }}
                onBlur={handleRename}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-1 py-0 text-sm border border-blue-400 rounded focus:outline-none bg-white"
              />
            ) : (
              <span className="flex-1 truncate">{page.name}</span>
            )}
            {renamingId !== page.id && (
              <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                {onFetchScreenshot && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onFetchScreenshot(page.name)
                    }}
                    className="text-gray-400 hover:text-blue-500 text-xs"
                    title="Fetch screenshots for this page"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete "${page.name}"?`)) deletePage(page.id)
                  }}
                  className="text-gray-400 hover:text-red-500 text-xs"
                >
                  x
                </button>
              </div>
            )}
          </div>
        ))}
        {pages.length === 0 && (
          <p className="p-3 text-xs text-gray-400">No pages yet. Click + to create one.</p>
        )}
      </nav>
    </aside>
  )
}
