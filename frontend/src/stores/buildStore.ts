import { create } from 'zustand'
import type { Build, BuildStatus } from '../types'

interface BuildStore {
  currentBuild: Build | null
  buildStatuses: Record<string, BuildStatus> // shapeId -> status
  setCurrentBuild: (build: Build | null) => void
  setShapeStatus: (shapeId: string, status: BuildStatus) => void
  clearStatuses: () => void
}

export const useBuildStore = create<BuildStore>((set) => ({
  currentBuild: null,
  buildStatuses: {},
  setCurrentBuild: (build) => set({ currentBuild: build }),
  setShapeStatus: (shapeId, status) =>
    set((s) => ({ buildStatuses: { ...s.buildStatuses, [shapeId]: status } })),
  clearStatuses: () => set({ buildStatuses: {} }),
}))
