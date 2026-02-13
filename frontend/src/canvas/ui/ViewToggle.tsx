import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'

interface ViewToggleProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null
}

export function ViewToggle({ excalidrawAPI: _api }: ViewToggleProps) {
  // View toggle is handled by the top Toolbar component
  // Excalidraw has built-in zoom controls
  return null
}
