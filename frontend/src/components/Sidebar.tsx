import { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { api } from '../services/api'
import { IconButton } from './ui/icon-button'

export function Sidebar() {
  const { pages, currentPage, currentProject, setCurrentPage, createPage, deletePage, updatePage } = useProjectStore()
  const [newPageName, setNewPageName] = useState('')
  const [adding, setAdding] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [scanning, setScanning] = useState(false)
  const [menuPageId, setMenuPageId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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
    setMenuPageId(null)
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

  // Close context menu on click outside
  useEffect(() => {
    if (!menuPageId) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPageId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuPageId])

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
            className={`group relative flex items-center px-3 py-2 text-sm cursor-pointer ${
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
              <div className="hidden group-hover:flex items-center ml-1">
                <IconButton
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuPageId(menuPageId === page.id ? null : page.id)
                  }}
                  title="More actions"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </IconButton>
              </div>
            )}

            {/* Context menu dropdown */}
            {menuPageId === page.id && (
              <div
                ref={menuRef}
                className="absolute right-2 top-8 z-50 bg-white border border-border rounded-md shadow-lg py-1 min-w-[120px]"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    startRename(page.id, page.name)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                  </svg>
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuPageId(null)
                    if (confirm(`Delete "${page.name}"?`)) deletePage(page.id)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete
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
