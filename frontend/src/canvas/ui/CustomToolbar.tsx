import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { createWireframeBox, createStickyNote } from '../Canvas'

interface CustomToolbarProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null
  activeTool: string
  devUrl?: string
  screenshotOpen?: boolean
  onScreenshotClick?: () => void
}

const tools = [
  { id: 'selection', excalidrawTool: 'selection', label: 'Select', kbd: 'V', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    </svg>
  )},
  { id: 'hand', excalidrawTool: 'hand', label: 'Hand', kbd: 'H', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v1" />
      <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  )},
  { id: 'wireframe-box', excalidrawTool: null, label: 'Wireframe', kbd: 'B', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  )},
  { id: 'sticky-note', excalidrawTool: null, label: 'Note', kbd: 'N', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
      <path d="M14 3v4a2 2 0 0 0 2 2h4" />
    </svg>
  )},
  { id: 'draw', excalidrawTool: 'freedraw', label: 'Draw', kbd: 'D', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </svg>
  )},
  { id: 'arrow', excalidrawTool: 'arrow', label: 'Arrow', kbd: 'A', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )},
  { id: 'text', excalidrawTool: 'text', label: 'Text', kbd: 'T', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  )},
  { id: 'eraser', excalidrawTool: 'eraser', label: 'Eraser', kbd: 'E', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  )},
]

export function CustomToolbar({ excalidrawAPI, activeTool, devUrl, screenshotOpen, onScreenshotClick }: CustomToolbarProps) {
  const handleToolClick = (tool: typeof tools[number]) => {
    if (!excalidrawAPI) return

    if (tool.id === 'wireframe-box') {
      createWireframeBox(excalidrawAPI)
      return
    }

    if (tool.id === 'sticky-note') {
      createStickyNote(excalidrawAPI)
      return
    }

    if (tool.excalidrawTool) {
      excalidrawAPI.setActiveTool({ type: tool.excalidrawTool as any })
    }
  }

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-0.5 bg-white border border-border rounded-[10px] p-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)] z-[100]">
      {tools.map((tool) => {
        const isActive = tool.excalidrawTool ? activeTool === tool.excalidrawTool : false
        return (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool)}
            title={`${tool.label} (${tool.kbd})`}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 text-[10px] rounded-md min-w-[44px] border-none cursor-pointer whitespace-nowrap ${
              isActive
                ? 'font-semibold text-primary bg-primary/10'
                : 'font-normal text-muted-foreground bg-transparent hover:bg-secondary'
            }`}
          >
            {tool.icon}
            {tool.label}
          </button>
        )
      })}

      {/* Screenshot camera button */}
      <div className="border-l border-border ml-0.5 pl-0.5">
        <button
          onClick={onScreenshotClick}
          title={devUrl ? 'Capture Screenshot' : 'Set Dev URL in Settings to enable'}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 text-[10px] rounded-md min-w-[44px] border-none cursor-pointer whitespace-nowrap ${
            screenshotOpen
              ? 'font-semibold text-primary bg-primary/10'
              : devUrl
                ? 'font-normal text-muted-foreground bg-transparent hover:bg-secondary'
                : 'font-normal text-gray-300 bg-transparent'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          Capture
        </button>
      </div>
    </div>
  )
}
