import { useState, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { Toolbar } from './Toolbar'
import { Canvas } from '../canvas/Canvas'
import { ChatPanel } from '../features/ai/ChatPanel'
import { BuildPlanOverlay } from '../features/ai/BuildPlanOverlay'
import { useProjectStore } from '../stores/projectStore'
import { useUIStore } from '../stores/uiStore'
import { useBuild } from '../features/ai/hooks/useBuild'
import { HistoryPanel } from '../features/history/HistoryPanel'

export function Layout() {
  const currentPage = useProjectStore((s) => s.currentPage)
  const currentProject = useProjectStore((s) => s.currentProject)
  const { chatOpen, setChatOpen, historyOpen, toggleHistory } = useUIStore()
  const [selectedShapes, setSelectedShapes] = useState<Array<{ id: string; type: string; label: string; description?: string }>>([])

  const build = useBuild()

  const handleBuild = useCallback(
    (shapes: Array<{ id: string; type: string; label: string; description?: string }>) => {
      if (!currentProject) return
      build.startPlan(shapes, currentProject.repo_path)
    },
    [currentProject, build]
  )

  const handleBuildApprove = useCallback(() => {
    if (!currentProject || !build.buildId || !build.plan) return
    build.executePlan(build.buildId, build.plan, currentProject.repo_path)
  }, [currentProject, build])

  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative">
          {currentPage ? (
            <Canvas
              key={currentPage.id}
              onBuild={handleBuild}
              onSelectionChange={setSelectedShapes}
              onChatOpen={() => setChatOpen(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Create or select a page to start
            </div>
          )}

          {/* Chat Panel */}
          {chatOpen && currentProject && currentPage && (
            <ChatPanel
              selectedShapes={selectedShapes}
              repoPath={currentProject.repo_path}
              pageName={currentPage.name}
              onClose={() => setChatOpen(false)}
            />
          )}

          {/* Build Plan Overlay */}
          {build.status !== 'idle' && (
            <BuildPlanOverlay
              plan={build.plan}
              status={build.status}
              progress={build.progress}
              onApprove={handleBuildApprove}
              onCancel={build.reset}
            />
          )}

          {/* History Panel */}
          {historyOpen && currentPage && (
            <HistoryPanel pageId={currentPage.id} onClose={toggleHistory} />
          )}
        </main>
      </div>
    </div>
  )
}
