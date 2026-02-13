import { useState } from 'react'
import { useProjectStore } from '../stores/projectStore'

export function Sidebar() {
  const { pages, currentPage, setCurrentPage, createPage, deletePage, updatePage } = useProjectStore()
  const [newPageName, setNewPageName] = useState('')
  const [adding, setAdding] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

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

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Pages</span>
        <button
          onClick={() => setAdding(!adding)}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          title="Add page"
        >
          +
        </button>
      </div>

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
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Delete "${page.name}"?`)) deletePage(page.id)
                }}
                className="hidden group-hover:block text-gray-400 hover:text-red-500 text-xs ml-1"
              >
                x
              </button>
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
