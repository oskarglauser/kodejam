import { useEditor, useValue } from 'tldraw'

interface BuildButtonProps {
  onBuild: (shapeIds: string[]) => void
}

export function BuildButton({ onBuild }: BuildButtonProps) {
  const editor = useEditor()
  const selectedIds = useValue('selection', () => editor.getSelectedShapeIds(), [editor])
  const hasSelection = selectedIds.length > 0

  if (!hasSelection) return null

  return (
    <button
      onClick={() => onBuild(selectedIds as string[])}
      style={{
        position: 'absolute',
        bottom: 64,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 20px',
        fontSize: 13,
        fontWeight: 600,
        color: 'white',
        background: '#2563eb',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 14 }}>&#9654;</span>
      Build ({selectedIds.length})
    </button>
  )
}
