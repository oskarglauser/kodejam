import { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { api } from '../services/api'
import { IconButton } from './ui/icon-button'
import { Input } from './ui/input'
import { ConfirmDialog } from './ui/confirm-dialog'

export function Sidebar() {
  const { pages, currentPage, currentProject, setCurrentPage, createPage, deletePage, updatePage } = useProjectStore()
  const [newPageName, setNewPageName] = useState('')
  const [adding, setAdding] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [scanning, setScanning] = useState(false)
  const [menuPageId, setMenuPageId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
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
    <aside className="w-56 bg-white border-r border-border flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pages</span>
        <div className="flex items-center gap-1">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleScanViews}
            disabled={scanning || !currentProject}
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
          </IconButton>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => setAdding(!adding)}
            title="Add page"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </IconButton>
        </div>
      </div>

      {scanning && (
        <div className="px-3 py-2 border-b border-border/50 bg-primary/5">
          <p className="text-xs text-primary">Scanning codebase for views...</p>
        </div>
      )}

      {adding && (
        <div className="p-2 border-b border-border/50">
          <Input
            autoFocus
            placeholder="Page name..."
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddPage()
              if (e.key === 'Escape') setAdding(false)
            }}
            className="h-8 text-[13px]"
          />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-1">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`group relative flex items-center gap-2 px-3 py-2 mx-2 my-0.5 rounded-md text-[13px] cursor-pointer transition-colors ${
              currentPage?.id === page.id
                ? 'bg-primary/[0.08] text-primary font-medium'
                : 'text-foreground/70 hover:bg-accent'
            }`}
            onClick={() => setCurrentPage(page)}
            onDoubleClick={() => startRename(page.id, page.name)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 shrink-0">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            </svg>

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
                className="flex-1 px-1 py-0 text-[13px] border border-primary rounded focus:outline-none bg-white"
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
                className="absolute right-2 top-8 z-50 bg-white border border-border/60 rounded-lg shadow-xl py-1 min-w-[140px]"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    startRename(page.id, page.name)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary"
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
                    setDeleteTarget({ id: page.id, name: page.name })
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
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
          <p className="px-4 py-8 text-xs text-muted-foreground text-center">No pages yet. Click + to create one.</p>
        )}
      </nav>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete page"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={async () => {
            const id = deleteTarget.id
            setDeleteTarget(null)
            await deletePage(id)
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </aside>
  )
}
