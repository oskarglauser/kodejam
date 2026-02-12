import './shape-types'
import {
  ShapeUtil,
  HTMLContainer,
  Rectangle2d,
  type TLShape,
  resizeBox,
} from 'tldraw'
import { T } from '@tldraw/validate'

export type WireframeBoxShape = TLShape<'wireframe-box'>

export class WireframeBoxUtil extends ShapeUtil<WireframeBoxShape> {
  static override type = 'wireframe-box' as const

  static override props = {
    w: T.number,
    h: T.number,
    label: T.string,
    description: T.string,
    buildStatus: T.string,
    screenshotUrl: T.string,
  }

  getDefaultProps(): WireframeBoxShape['props'] {
    return {
      w: 200,
      h: 150,
      label: 'Component',
      description: '',
      buildStatus: 'sketch',
      screenshotUrl: '',
    }
  }

  getGeometry(shape: WireframeBoxShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  override canEdit() {
    return true
  }

  override canResize() {
    return true
  }

  override onResize = (shape: any, info: any) => {
    return resizeBox(shape, info)
  }

  component(shape: WireframeBoxShape) {
    const { w, h, label, description, buildStatus, screenshotUrl } = shape.props
    const isEditing = this.editor.getEditingShapeId() === shape.id

    const statusColors: Record<string, string> = {
      sketch: '#9ca3af',
      building: '#eab308',
      built: '#22c55e',
      error: '#ef4444',
    }

    const showScreenshot = screenshotUrl && !isEditing

    return (
      <HTMLContainer
        style={{
          width: w,
          height: h,
          pointerEvents: 'all',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            border: '2px dashed #94a3b8',
            borderRadius: 8,
            background: showScreenshot ? 'transparent' : '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Status badge */}
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusColors[buildStatus] ?? statusColors.sketch,
              boxShadow: '0 0 0 2px white',
              zIndex: 1,
            }}
          />

          {showScreenshot ? (
            <img
              src={screenshotUrl}
              alt={label}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 6,
              }}
            />
          ) : (
            <div
              style={{
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                flex: 1,
              }}
            >
              {isEditing ? (
                <input
                  autoFocus
                  defaultValue={label}
                  onBlur={(e) => {
                    this.editor.updateShape<WireframeBoxShape>({
                      id: shape.id,
                      type: 'wireframe-box',
                      props: { label: e.target.value },
                    })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                      this.editor.setEditingShape(null)
                    }
                    e.stopPropagation()
                  }}
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#1e293b',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    padding: 0,
                    width: '100%',
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#1e293b',
                    lineHeight: 1.3,
                  }}
                >
                  {label}
                </div>
              )}
              {description && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#64748b',
                    lineHeight: 1.4,
                  }}
                >
                  {description}
                </div>
              )}
            </div>
          )}
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: WireframeBoxShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={8}
        ry={8}
        fill="none"
      />
    )
  }
}
