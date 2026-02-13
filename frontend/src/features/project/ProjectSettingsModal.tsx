import { useState, useEffect } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import type { ProjectSettings } from '../../types'

interface Props {
  onClose: () => void
}

function parseSettings(settingsJson: string): ProjectSettings {
  try {
    return JSON.parse(settingsJson) as ProjectSettings
  } catch {
    return {}
  }
}

const CANVAS_COLOR_PRESETS = [
  { label: 'Light Stone', value: '#f5f5f4' },
  { label: 'White', value: '#ffffff' },
  { label: 'Light Gray', value: '#f0f0f0' },
  { label: 'Light Blue', value: '#f0f4ff' },
  { label: 'Light Green', value: '#f0fdf4' },
  { label: 'Warm', value: '#fefce8' },
]

export function ProjectSettingsModal({ onClose }: Props) {
  const { currentProject, updateProject } = useProjectStore()
  const [devUrl, setDevUrl] = useState('')
  const [canvasColor, setCanvasColor] = useState('#f5f5f4')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentProject) {
      const settings = parseSettings(currentProject.settings)
      setDevUrl(settings.dev_url || '')
      setCanvasColor(settings.canvas_color || '#f5f5f4')
    }
  }, [currentProject])

  if (!currentProject) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProject(currentProject.id, {
        settings: { dev_url: devUrl.trim(), canvas_color: canvasColor },
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Project Settings</h2>
          <button onClick={onClose} style={styles.closeBtn}>&times;</button>
        </div>

        <div style={styles.body}>
          <div style={styles.field}>
            <label style={styles.label}>Project Name</label>
            <div style={styles.readOnly}>{currentProject.name}</div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Repository Path</label>
            <div style={styles.readOnly}>{currentProject.repo_path}</div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Dev Server URL</label>
            <input
              type="text"
              value={devUrl}
              onChange={(e) => setDevUrl(e.target.value)}
              placeholder="http://localhost:3000"
              style={styles.input}
            />
            <p style={styles.hint}>
              Set this to your app's dev server URL to enable screenshot capture from chat.
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

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
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
  readOnly: {
    fontSize: 13,
    color: '#6b7280',
    padding: '6px 0',
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
