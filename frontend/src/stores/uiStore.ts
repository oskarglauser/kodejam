import { create } from 'zustand'

type ViewMode = 'sketch' | 'built'

interface UIStore {
  viewMode: ViewMode
  chatOpen: boolean
  historyOpen: boolean
  screenshotOpen: boolean
  showSettings: boolean
  setViewMode: (mode: ViewMode) => void
  toggleChat: () => void
  toggleHistory: () => void
  setChatOpen: (open: boolean) => void
  toggleScreenshot: () => void
  setScreenshotOpen: (open: boolean) => void
  setShowSettings: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  viewMode: 'sketch',
  chatOpen: true,
  historyOpen: false,
  screenshotOpen: false,
  showSettings: false,
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  toggleHistory: () => set((s) => ({ historyOpen: !s.historyOpen })),
  setChatOpen: (open) => set({ chatOpen: open }),
  toggleScreenshot: () => set((s) => ({ screenshotOpen: !s.screenshotOpen })),
  setScreenshotOpen: (open) => set({ screenshotOpen: open }),
  setShowSettings: (open) => set({ showSettings: open }),
}))
