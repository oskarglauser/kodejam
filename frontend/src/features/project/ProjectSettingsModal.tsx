import { useState, useEffect, useRef, useCallback } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { DirectoryPicker } from '../../components/DirectoryPicker'
import type { ExcalidrawImperativeAPI } from '../../canvas/Canvas'
import type { ProjectSettings } from '../../types'

interface Props {
  onClose: () => void
  excalidrawAPI?: ExcalidrawImperativeAPI | null
}

function parseSettings(settingsJson: string): ProjectSettings {
  try {
    return JSON.parse(settingsJson) as ProjectSettings
  } catch {
    return {}
  }
}

const CANVAS_COLOR_PRESETS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Light Gray', value: '#f0f0f0' },
  { label: 'Silver', value: '#e5e5e5' },
  { label: 'Gray', value: '#d4d4d4' },
  { label: 'Medium Gray', value: '#c0c0c0' },
  { label: 'Dark Gray', value: '#a3a3a3' },
]

const DEFAULT_CANVAS_COLOR = '#d4d4d4'

export function ProjectSettingsModal({ onClose, excalidrawAPI }: Props) {
  const { currentProject, updateProject } = useProjectStore()
  const [projectName, setProjectName] = useState('')
  const [repoPath, setRepoPath] = useState('')
  const [repoPathError, setRepoPathError] = useState('')
  const [devUrl, setDevUrl] = useState('')
  const [canvasColor, setCanvasColor] = useState(DEFAULT_CANVAS_COLOR)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showDirPicker, setShowDirPicker] = useState(false)
  const originalColorRef = useRef(DEFAULT_CANVAS_COLOR)

  useEffect(() => {
    if (currentProject) {
      const settings = parseSettings(currentProject.settings)
      setProjectName(currentProject.name)
      setRepoPath(currentProject.repo_path)
      setDevUrl(settings.dev_url || '')
      const color = settings.canvas_color || DEFAULT_CANVAS_COLOR
      setCanvasColor(color)
      originalColorRef.current = color
    }
  }, [currentProject])

  // Live preview: update canvas background as user picks colors
  useEffect(() => {
    if (excalidrawAPI && canvasColor) {
      excalidrawAPI.updateScene({ appState: { viewBackgroundColor: canvasColor } })
    }
  }, [canvasColor, excalidrawAPI])

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') handleCancel()
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!currentProject) return null

  function validateRepoPath(value: string): string {
    const trimmed = value.trim()
    if (!trimmed) return 'Repository path is required'
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
    setSaveError('')
  }

  const handleCancel = () => {
    // Revert canvas color preview
    if (excalidrawAPI && originalColorRef.current) {
      excalidrawAPI.updateScene({ appState: { viewBackgroundColor: originalColorRef.current } })
    }
    onClose()
  }

  const handleSave = async () => {
    const pathError = validateRepoPath(repoPath)
    if (pathError) {
      setRepoPathError(pathError)
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      await updateProject(currentProject.id, {
        name: projectName.trim() || currentProject.name,
        repo_path: repoPath.trim(),
        settings: { dev_url: devUrl.trim(), canvas_color: canvasColor },
      })
      onClose()
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={handleCancel}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-label="Project Settings" onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Project Settings</h2>
          <button onClick={handleCancel} style={styles.closeBtn} aria-label="Close">&times;</button>
        </div>

        <div style={styles.body}>
          <div style={styles.field}>
            <label style={styles.label}>Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Local Project Path</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={repoPath}
                onChange={(e) => handleRepoPathChange(e.target.value)}
                placeholder="/Users/you/projects/myapp"
                style={{
                  ...styles.input,
                  flex: 1,
                  ...(repoPathError ? { borderColor: '#ef4444' } : {}),
                }}
              />
              <button
                type="button"
                onClick={() => setShowDirPicker(true)}
                style={styles.browseBtn}
              >
                Browse
              </button>
            </div>
            {repoPathError && (
              <p style={{ fontSize: 11, color: '#ef4444', margin: 0 }}>{repoPathError}</p>
            )}
          </div>
          {showDirPicker && (
            <DirectoryPicker
              initialPath={repoPath.startsWith('/') ? repoPath : undefined}
              onSelect={(path) => {
                handleRepoPathChange(path)
                setShowDirPicker(false)
              }}
              onCancel={() => setShowDirPicker(false)}
            />
          )}

          <div style={styles.field}>
            <label style={styles.label}>
              Dev Server URL
              <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 4 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={devUrl}
              onChange={(e) => setDevUrl(e.target.value)}
              placeholder="http://localhost:3000"
              style={styles.input}
            />
            <p style={styles.hint}>
              Enables screenshot capture from chat. Leave empty if not needed.
            </p>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Canvas Background</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {CANVAS_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setCanvasColor(preset.value)}
                  title={preset.label}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: canvasColor === preset.value ? '2px solid #2563eb' : '1px solid #d1d5db',
                    background: preset.value,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
              <input
                type="color"
                value={canvasColor}
                onChange={(e) => setCanvasColor(e.target.value)}
                title="Custom color"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            </div>
          </div>
        </div>

        {saveError && (
          <div style={{ padding: '0 20px 8px', color: '#ef4444', fontSize: 12 }}>{saveError}</div>
        )}
        <div style={styles.footer}>
          <button onClick={handleCancel} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !!repoPathError} style={styles.saveBtn}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
    width: 440,
    maxWidth: '90vw',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  body: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  hint: {
    fontSize: 11,
    color: '#9ca3af',
    margin: 0,
    lineHeight: 1.4,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '12px 20px',
    borderTop: '1px solid #e5e7eb',
  },
  cancelBtn: {
    padding: '6px 14px',
    fontSize: 12,
    color: '#374151',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: 'pointer',
  },
  browseBtn: {
    padding: '8px 12px',
    fontSize: 12,
    color: '#374151',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  saveBtn: {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    background: '#2563eb',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
}
