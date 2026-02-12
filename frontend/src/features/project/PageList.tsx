import { useProjectStore } from '../../stores/projectStore'

export function PageList() {
  const { pages, currentPage, setCurrentPage } = useProjectStore()

  return (
    <div className="space-y-1">
      {pages.map((page) => (
        <button
          key={page.id}
          onClick={() => setCurrentPage(page)}
          className={`w-full text-left px-2 py-1.5 text-sm rounded ${
            currentPage?.id === page.id
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {page.name}
        </button>
      ))}
    </div>
  )
}
