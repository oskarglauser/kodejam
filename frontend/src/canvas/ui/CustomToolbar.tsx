import { useEditor, useValue } from 'tldraw'

export function CustomToolbar() {
  const editor = useEditor()
  const currentToolId = useValue('current tool', () => editor.getCurrentToolId(), [editor])

  const tools = [
    { id: 'select', label: 'Select', kbd: 'V' },
    { id: 'hand', label: 'Hand', kbd: 'H' },
    { id: 'wireframe-box', label: 'Wireframe', kbd: 'B' },
    { id: 'sticky-note', label: 'Note', kbd: 'N' },
    { id: 'draw', label: 'Draw', kbd: 'D' },
    { id: 'arrow', label: 'Arrow', kbd: 'A' },
    { id: 'text', label: 'Text', kbd: 'T' },
    { id: 'eraser', label: 'Eraser', kbd: 'E' },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 2,
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        zIndex: 100,
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => editor.setCurrentTool(tool.id)}
          title={`${tool.label} (${tool.kbd})`}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: currentToolId === tool.id ? 600 : 400,
            color: currentToolId === tool.id ? '#2563eb' : '#64748b',
            background: currentToolId === tool.id ? '#eff6ff' : 'transparent',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {tool.label}
        </button>
      ))}
    </div>
  )
}
