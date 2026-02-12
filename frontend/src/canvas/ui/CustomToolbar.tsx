import { useEditor, useValue } from 'tldraw'

const tools = [
  { id: 'select', label: 'Select', kbd: 'V', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    </svg>
  )},
  { id: 'hand', label: 'Hand', kbd: 'H', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v1" />
      <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  )},
  { id: 'wireframe-box', label: 'Wireframe', kbd: 'B', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  )},
  { id: 'sticky-note', label: 'Note', kbd: 'N', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
      <path d="M14 3v4a2 2 0 0 0 2 2h4" />
    </svg>
  )},
  { id: 'draw', label: 'Draw', kbd: 'D', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </svg>
  )},
  { id: 'arrow', label: 'Arrow', kbd: 'A', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )},
  { id: 'text', label: 'Text', kbd: 'T', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  )},
  { id: 'eraser', label: 'Eraser', kbd: 'E', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  )},
]

export function CustomToolbar() {
  const editor = useEditor()
  const currentToolId = useValue('current tool', () => editor.getCurrentToolId(), [editor])

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
      {tools.map((tool) => {
        const isActive = currentToolId === tool.id
        return (
          <button
            key={tool.id}
            onClick={() => editor.setCurrentTool(tool.id)}
            title={`${tool.label} (${tool.kbd})`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 10px',
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#2563eb' : '#64748b',
              background: isActive ? '#eff6ff' : 'transparent',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              minWidth: 44,
            }}
          >
            {tool.icon}
            {tool.label}
          </button>
        )
      })}
    </div>
  )
}
