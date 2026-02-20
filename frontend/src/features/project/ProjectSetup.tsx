import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../stores/projectStore'
import { DirectoryPicker } from '../../components/DirectoryPicker'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'

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
    <div className="min-h-screen bg-[hsl(220,14%,97%)] flex flex-col items-center pt-16 px-6">
      <div className="max-w-xl w-full">
        {/* Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Kodejam</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Visual canvas for AI-powered code generation</p>
        </div>

        {/* Project list */}
        {projects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Projects</h2>
            <div className="space-y-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="group flex items-center bg-white rounded-xl border border-border/60 px-4 py-3.5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-150"
                  onClick={() => navigate(`/project/${p.id}`)}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/[0.08] flex items-center justify-center shrink-0 mr-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{p.repo_path}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete project "${p.name}"?`)) deleteProject(p.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create project */}
        {creating ? (
          <div className="bg-white rounded-xl border border-border/60 p-5 shadow-sm">
            <h2 className="text-[14px] font-semibold text-foreground mb-3">New Project</h2>
            <Input
              autoFocus
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className="mb-3"
            />
            <Label className="mb-1 block">Local project path</Label>
            <div className="flex gap-2 mb-1">
              <Input
                placeholder="/Users/you/projects/myapp"
                value={repoPath}
                onChange={(e) => handleRepoPathChange(e.target.value)}
                disabled={submitting}
                className={repoPathError ? 'border-destructive focus-visible:border-destructive' : ''}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDirPicker(true)}
                className="shrink-0"
              >
                Browse
              </Button>
            </div>
            {repoPathError ? (
              <p className="text-xs text-destructive mb-3">{repoPathError}</p>
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
            <Input
              placeholder="Dev server URL (e.g. http://localhost:3000)"
              value={devUrl}
              onChange={(e) => setDevUrl(e.target.value)}
              disabled={submitting}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || !repoPath.trim() || !!repoPathError || submitting}
              >
                {submitting ? 'Creating...' : 'Create'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCreating(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full py-3 border border-dashed border-border rounded-xl text-[13px] text-muted-foreground font-medium flex items-center justify-center gap-2 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-150"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            New Project
          </button>
        )}
      </div>
    </div>
  )
}
