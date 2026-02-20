import { useState, useEffect, useRef } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { DirectoryPicker } from '../../components/DirectoryPicker'
import { ModalOverlay, ModalContent, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter } from '../../components/ui/modal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
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

  // Live preview: update CSS variable so dot-grid background changes in real time
  useEffect(() => {
    if (canvasColor) {
      document.documentElement.style.setProperty('--kodejam-canvas-bg', canvasColor)
    }
  }, [canvasColor])

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
    // Revert CSS variable to original color
    if (originalColorRef.current) {
      document.documentElement.style.setProperty('--kodejam-canvas-bg', originalColorRef.current)
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
    <ModalOverlay onClose={handleCancel}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Project Settings</ModalTitle>
          <ModalClose onClick={handleCancel} />
        </ModalHeader>

        <ModalBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label>Project Name</Label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Local Project Path</Label>
            <div className="flex gap-2">
              <Input
                value={repoPath}
                onChange={(e) => handleRepoPathChange(e.target.value)}
                placeholder="/Users/you/projects/myapp"
                className={repoPathError ? 'border-destructive' : ''}
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
            {repoPathError && (
              <p className="text-[11px] text-destructive m-0">{repoPathError}</p>
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

          <div className="flex flex-col gap-1">
            <Label>
              Dev Server URL
              <span className="font-normal text-muted-foreground ml-1">(optional)</span>
            </Label>
            <Input
              value={devUrl}
              onChange={(e) => setDevUrl(e.target.value)}
              placeholder="http://localhost:3000"
            />
            <p className="text-[11px] text-muted-foreground m-0 leading-snug">
              Enables screenshot capture from chat. Leave empty if not needed.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Canvas Background</Label>
            <div className="flex gap-1.5 flex-wrap">
              {CANVAS_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setCanvasColor(preset.value)}
                  title={preset.label}
                  className="w-7 h-7 rounded-md border cursor-pointer p-0"
                  style={{
                    background: preset.value,
                    borderColor: canvasColor === preset.value ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    borderWidth: canvasColor === preset.value ? 2 : 1,
                  }}
                />
              ))}
              <input
                type="color"
                value={canvasColor}
                onChange={(e) => setCanvasColor(e.target.value)}
                title="Custom color"
                className="w-7 h-7 rounded-md border border-border cursor-pointer p-0"
              />
            </div>
          </div>
        </ModalBody>

        {saveError && (
          <div className="px-5 pb-2 text-destructive text-xs">{saveError}</div>
        )}

        <ModalFooter>
          <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !!repoPathError}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  )
}
