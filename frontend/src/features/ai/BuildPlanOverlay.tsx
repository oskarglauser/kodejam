import type { BuildPlan, BuildFlowStatus } from './hooks/useBuild'

interface BuildPlanOverlayProps {
  plan: BuildPlan | null
  status: BuildFlowStatus
  progress: string[]
  onApprove: () => void
  onCancel: () => void
}

export function BuildPlanOverlay({
  plan,
  status,
  progress,
  onApprove,
  onCancel,
}: BuildPlanOverlayProps) {
  const isPlanning = status === 'planning'
  const isShowingPlan = status === 'showing-plan'
  const isBuilding = status === 'building'
  const isCompleted = status === 'completed'
  const isError = status === 'error'

  return (
    <div style={styles.backdrop} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            {isPlanning && 'Generating Build Plan...'}
            {isShowingPlan && 'Build Plan'}
            {isBuilding && 'Building...'}
            {isCompleted && 'Build Complete'}
            {isError && 'Build Error'}
          </h2>
          <button onClick={onCancel} style={styles.closeButton} title="Close">
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={styles.body}>
          {/* Planning spinner */}
          {isPlanning && (
            <div style={styles.spinnerContainer}>
              <div style={styles.spinner} />
              <p style={styles.spinnerText}>
                Analyzing your designs and generating a build plan...
              </p>
              {progress.length > 0 && (
                <div style={styles.progressList}>
                  {progress.map((line, idx) => (
                    <div key={idx} style={styles.progressLine}>
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Plan display */}
          {(isShowingPlan || isBuilding || isCompleted) && plan && (
            <>
              {/* Summary */}
              <div style={styles.summarySection}>
                <h3 style={styles.sectionTitle}>Summary</h3>
                <p style={styles.summaryText}>{plan.summary}</p>
              </div>

              {/* Steps */}
              {plan.steps.length > 0 && (
                <div style={styles.stepsSection}>
                  <h3 style={styles.sectionTitle}>
                    Files ({plan.steps.length})
                  </h3>
                  <div style={styles.stepsList}>
                    {plan.steps.map((step, idx) => (
                      <div key={idx} style={styles.stepItem}>
                        <span
                          style={{
                            ...styles.actionBadge,
                            ...getActionBadgeStyle(step.action),
                          }}
                        >
                          {step.action}
                        </span>
                        <div style={styles.stepDetails}>
                          <span style={styles.fileName}>{step.file}</span>
                          <span style={styles.stepDescription}>
                            {step.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Build progress */}
          {(isBuilding || isCompleted) && progress.length > 0 && (
            <div style={styles.buildProgress}>
              <h3 style={styles.sectionTitle}>Progress</h3>
              <div style={styles.progressLog}>
                {progress.map((line, idx) => (
                  <div key={idx} style={styles.logLine}>
                    <span style={styles.logCheck}>
                      {idx < progress.length - 1 || isCompleted ? '\u2713' : '\u25CB'}
                    </span>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed message */}
          {isCompleted && (
            <div style={styles.completedBanner}>
              <span style={styles.completedIcon}>{'\u2713'}</span>
              Build completed successfully
            </div>
          )}

          {/* Error message */}
          {isError && (
            <div style={styles.errorBanner}>
              <span style={styles.errorIcon}>!</span>
              An error occurred during the build. Check the progress log above for details.
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={styles.footer}>
          {isShowingPlan && (
            <>
              <button onClick={onCancel} style={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={onApprove} style={styles.approveButton}>
                Approve & Build
              </button>
            </>
          )}

          {isPlanning && (
            <button onClick={onCancel} style={styles.cancelButton}>
              Cancel
            </button>
          )}

          {isBuilding && (
            <button onClick={onCancel} style={styles.cancelButton}>
              Cancel Build
            </button>
          )}

          {(isCompleted || isError) && (
            <button onClick={onCancel} style={styles.closeFooterButton}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Action badge colour helpers
// ---------------------------------------------------------------------------

function getActionBadgeStyle(
  action: 'create' | 'modify' | 'delete',
): React.CSSProperties {
  switch (action) {
    case 'create':
      return { background: '#dcfce7', color: '#166534' }
    case 'modify':
      return { background: '#fef3c7', color: '#92400e' }
    case 'delete':
      return { background: '#fee2e2', color: '#991b1b' }
    default:
      return { background: '#f3f4f6', color: '#4b5563' }
  }
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  modal: {
    background: '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 580,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: 22,
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },

  // Body
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
  },

  // Planning spinner
  spinnerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 0',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    // Note: animation requires a keyframe; the spinner will be static with inline styles.
    // In production, inject a <style> tag or use a CSS file for the animation.
  },
  spinnerText: {
    marginTop: 16,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Summary section
  summarySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  summaryText: {
    margin: 0,
    fontSize: 14,
    color: '#374151',
    lineHeight: 1.6,
  },

  // Steps list
  stepsSection: {
    marginBottom: 20,
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  stepItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '8px 12px',
    borderRadius: 8,
    background: '#f9fafb',
    border: '1px solid #f3f4f6',
  },
  actionBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    flexShrink: 0,
    marginTop: 2,
  },
  stepDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  fileName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#111827',
    fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace',
    wordBreak: 'break-all',
  },
  stepDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 1.4,
  },

  // Build progress
  buildProgress: {
    marginBottom: 16,
  },
  progressList: {
    marginTop: 12,
    width: '100%',
    maxWidth: 400,
  },
  progressLine: {
    fontSize: 12,
    color: '#6b7280',
    padding: '2px 0',
  },
  progressLog: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '12px',
    borderRadius: 8,
    background: '#f9fafb',
    border: '1px solid #f3f4f6',
    maxHeight: 200,
    overflowY: 'auto',
  },
  logLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#374151',
    fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace',
  },
  logCheck: {
    color: '#22c55e',
    fontWeight: 600,
    fontSize: 12,
    flexShrink: 0,
  },

  // Completed banner
  completedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    borderRadius: 8,
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    fontSize: 14,
    fontWeight: 500,
  },
  completedIcon: {
    fontSize: 16,
    fontWeight: 700,
  },

  // Error banner
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    borderRadius: 8,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    fontSize: 14,
    fontWeight: 500,
  },
  errorIcon: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#ef4444',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },

  // Footer
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '12px 20px',
    borderTop: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  cancelButton: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    background: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: 'pointer',
  },
  approveButton: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#ffffff',
    background: '#2563eb',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  closeFooterButton: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    background: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: 'pointer',
  },
}
