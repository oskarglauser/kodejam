import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../stores/projectStore'

export function ProjectSetup() {
  const { projects, loadProjects, createProject, deleteProject, loading } = useProjectStore()
  const [name, setName] = useState('')
  const [repoPath, setRepoPath] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreate = async () => {
    if (!name.trim() || !repoPath.trim()) return
    const project = await createProject(name.trim(), repoPath.trim())
    navigate(`/project/${project.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 px-4">
      <div className="max-w-lg w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Kodejam</h1>
        <p className="text-sm text-gray-500 mb-8">Visual canvas for AI-powered code generation</p>

        {/* Project list */}
        {projects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Projects</h2>
            <div className="space-y-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="group flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => navigate(`/project/${p.id}`)}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{p.repo_path}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete project "${p.name}"?`)) deleteProject(p.id)
                    }}
                    className="hidden group-hover:block text-xs text-gray-400 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create project */}
        {creating ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">New Project</h2>
            <input
              autoFocus
              type="text"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md mb-3 focus:outline-none focus:border-blue-400"
            />
            <input
              type="text"
              placeholder="Path to git repo (e.g. /Users/you/projects/myapp)"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md mb-4 focus:outline-none focus:border-blue-400"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!name.trim() || !repoPath.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40"
              >
                Create
              </button>
              <button
                onClick={() => setCreating(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full py-3 text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + New Project
          </button>
        )}
      </div>
    </div>
  )
}
