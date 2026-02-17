import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../stores/projectStore'
import { DirectoryPicker } from '../../components/DirectoryPicker'

export function ProjectSetup() {
  const { projects, loadProjects, createProject, deleteProject, loading } = useProjectStore()
  const [name, setName] = useState('')
  const [repoPath, setRepoPath] = useState('')
  const [devUrl, setDevUrl] = useState('')
  const [creating, setCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [repoPathError, setRepoPathError] = useState('')
  const [showDirPicker, setShowDirPicker] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadProjects()
  }, [])

  function validateRepoPath(value: string): string {
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (/^(https?:\/\/|git@|ssh:\/\/|ftp:\/\/)/.test(trimmed)) {
      return 'Must be a local directory path, not a URL'
    }
    if (!trimmed.startsWith('/')) {
      return 'Must be an absolute path starting with /'
    }
    return ''
  }

  const handleRepoPathChange = (value: string) => {
    setRepoPath(value)
    setRepoPathError(validateRepoPath(value))
  }

  const handleCreate = async () => {
    const error = validateRepoPath(repoPath)
    if (error) {
      setRepoPathError(error)
      return
    }
    if (!name.trim() || !repoPath.trim()) return
    setSubmitting(true)
    try {
      const project = await createProject(name.trim(), repoPath.trim(), devUrl.trim() || undefined)
      navigate(`/project/${project.id}`)
    } catch (err: any) {
      const message = err?.message || 'Failed to create project'
      setRepoPathError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 px-4">
      <div className="max-w-lg w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Kodejam</h1>
        <p className="text-sm text-gray-500 mb-8 text-center">Visual canvas for AI-powered code generation</p>

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
              disabled={submitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md mb-3 focus:outline-none focus:border-blue-400 disabled:opacity-50"
            />
            <label className="text-xs font-medium text-gray-500 mb-1">Local project path</label>
            <div className="flex gap-2 mb-1">
              <input
                type="text"
                placeholder="/Users/you/projects/myapp"
                value={repoPath}
                onChange={(e) => handleRepoPathChange(e.target.value)}
                disabled={submitting}
                className={`flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none disabled:opacity-50 ${repoPathError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'}`}
              />
              <button
                type="button"
                onClick={() => setShowDirPicker(true)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 whitespace-nowrap"
              >
                Browse
              </button>
            </div>
            {repoPathError ? (
              <p className="text-xs text-red-500 mb-3">{repoPathError}</p>
            ) : (
              <div className="mb-2" />
            )}
            {showDirPicker && (
              <DirectoryPicker
                initialPath={repoPath || undefined}
                onSelect={(path) => {
                  handleRepoPathChange(path)
                  setShowDirPicker(false)
                }}
                onCancel={() => setShowDirPicker(false)}
              />
            )}
            <input
              type="text"
              placeholder="Dev server URL (e.g. http://localhost:3000)"
              value={devUrl}
              onChange={(e) => setDevUrl(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md mb-4 focus:outline-none focus:border-blue-400 disabled:opacity-50"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!name.trim() || !repoPath.trim() || !!repoPathError || submitting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40"
              >
                {submitting ? 'Creating...' : 'Create'}
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
