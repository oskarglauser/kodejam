import { useUIStore } from '../../stores/uiStore'

export function ViewToggle() {
  const { viewMode, setViewMode } = useUIStore()

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        display: 'flex',
        gap: 2,
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: 3,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        zIndex: 100,
      }}
    >
      <button
        onClick={() => setViewMode('sketch')}
        style={{
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: viewMode === 'sketch' ? 600 : 400,
          color: viewMode === 'sketch' ? '#1e293b' : '#94a3b8',
          background: viewMode === 'sketch' ? '#f1f5f9' : 'transparent',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer',
        }}
      >
        Sketch
      </button>
      <button
        onClick={() => setViewMode('built')}
        style={{
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: viewMode === 'built' ? 600 : 400,
          color: viewMode === 'built' ? '#1e293b' : '#94a3b8',
          background: viewMode === 'built' ? '#f1f5f9' : 'transparent',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer',
        }}
      >
        Built
      </button>
    </div>
  )
}
