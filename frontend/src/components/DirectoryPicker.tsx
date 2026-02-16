import { useState, useEffect } from 'react'

interface Props {
  initialPath?: string
  onSelect: (path: string) => void
  onCancel: () => void
}

interface BrowseResult {
  path: string
  dirs: string[]
}

export function DirectoryPicker({ initialPath, onSelect, onCancel }: Props) {
  const [currentPath, setCurrentPath] = useState(initialPath || '')
  const [dirs, setDirs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const browse = async (dirPath?: string) => {
    setLoading(true)
    setError('')
    try {
      const params = dirPath ? `?path=${encodeURIComponent(dirPath)}` : ''
      const res = await fetch(`/api/browse${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Failed to browse' }))
        throw new Error(body.error)
      }
      const data: BrowseResult = await res.json()
      setCurrentPath(data.path)
      setDirs(data.dirs)
    } catch (err: any) {
      setError(err.message || 'Failed to browse directory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    browse(initialPath || undefined)
  }, [])

  const pathSegments = currentPath.split('/').filter(Boolean)

  const navigateTo = (segmentIndex: number) => {
    const newPath = '/' + pathSegments.slice(0, segmentIndex + 1).join('/')
    browse(newPath)
  }

  const navigateInto = (dirName: string) => {
    const newPath = currentPath === '/' ? `/${dirName}` : `${currentPath}/${dirName}`
    browse(newPath)
  }

  const navigateUp = () => {
    if (currentPath === '/') return
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/'
    browse(parent)
  }

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Select project folder</h3>
          <button onClick={onCancel} style={styles.closeBtn}>&times;</button>
        </div>

        {/* Breadcrumbs */}
        <div style={styles.breadcrumbs}>
          <button
            onClick={() => browse('/')}
            style={styles.breadcrumb}
          >
            /
          </button>
          {pathSegments.map((seg, i) => (
            <span key={i}>
              <span style={{ color: '#9ca3af' }}>/</span>
              <button
                onClick={() => navigateTo(i)}
                style={{
                  ...styles.breadcrumb,
                  ...(i === pathSegments.length - 1 ? { fontWeight: 600, color: '#111827' } : {}),
                }}
              >
                {seg}
              </button>
            </span>
          ))}
        </div>

        {/* Directory listing */}
        <div style={styles.listing}>
          {loading ? (
            <div style={styles.empty}>Loading...</div>
          ) : error ? (
            <div style={{ ...styles.empty, color: '#ef4444' }}>{error}</div>
          ) : dirs.length === 0 ? (
            <div style={styles.empty}>No subdirectories</div>
          ) : (
            <>
              {currentPath !== '/' && (
                <button onClick={navigateUp} style={styles.dirItem}>
                  <span style={styles.folderIcon}>&#8592;</span>
                  <span>..</span>
                </button>
              )}
              {dirs.map((dir) => (
                <button
                  key={dir}
                  onClick={() => navigateInto(dir)}
                  style={styles.dirItem}
                >
                  <span style={styles.folderIcon}>&#128193;</span>
                  <span>{dir}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.selectedPath} title={currentPath}>
            {currentPath}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCancel} style={styles.cancelBtn}>Cancel</button>
            <button
              onClick={() => onSelect(currentPath)}
              style={styles.selectBtn}
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
    width: 480,
    maxWidth: '90vw',
    maxHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  breadcrumbs: {
    padding: '8px 16px',
    fontSize: 12,
    borderBottom: '1px solid #f3f4f6',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  breadcrumb: {
    background: 'none',
    border: 'none',
    fontSize: 12,
    color: '#2563eb',
    cursor: 'pointer',
    padding: '2px 2px',
  },
  listing: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
    minHeight: 200,
    maxHeight: 360,
  },
  dirItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '7px 16px',
    background: 'none',
    border: 'none',
    fontSize: 13,
    color: '#374151',
    cursor: 'pointer',
    textAlign: 'left',
  },
  folderIcon: {
    fontSize: 14,
    width: 18,
    textAlign: 'center',
    flexShrink: 0,
  },
  empty: {
    padding: '24px 16px',
    textAlign: 'center',
    fontSize: 13,
    color: '#9ca3af',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderTop: '1px solid #e5e7eb',
    gap: 12,
  },
  selectedPath: {
    fontSize: 12,
    color: '#6b7280',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
  },
  cancelBtn: {
    padding: '6px 12px',
    fontSize: 12,
    color: '#374151',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: 'pointer',
  },
  selectBtn: {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    background: '#2563eb',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
}
