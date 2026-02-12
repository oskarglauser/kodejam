import { create } from 'zustand'

type ViewMode = 'sketch' | 'built'

interface UIStore {
  viewMode: ViewMode
  chatOpen: boolean
  historyOpen: boolean
  setViewMode: (mode: ViewMode) => void
  toggleChat: () => void
  toggleHistory: () => void
  setChatOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  viewMode: 'sketch',
  chatOpen: false,
  historyOpen: false,
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  toggleHistory: () => set((s) => ({ historyOpen: !s.historyOpen })),
  setChatOpen: (open) => set({ chatOpen: open }),
}))
