import { useState } from 'react'
import { useProjectStore } from '../stores/projectStore'

export function Sidebar() {
  const { pages, currentPage, setCurrentPage, createPage, deletePage } = useProjectStore()
  const [newPageName, setNewPageName] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAddPage = async () => {
    if (!newPageName.trim()) return
    const page = await createPage(newPageName.trim())
    setCurrentPage(page)
    setNewPageName('')
    setAdding(false)
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
          >
            <span className="flex-1 truncate">{page.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Delete "${page.name}"?`)) deletePage(page.id)
              }}
              className="hidden group-hover:block text-gray-400 hover:text-red-500 text-xs ml-1"
            >
              x
            </button>
          </div>
        ))}
        {pages.length === 0 && (
          <p className="p-3 text-xs text-gray-400">No pages yet. Click + to create one.</p>
        )}
      </nav>
    </aside>
  )
}
