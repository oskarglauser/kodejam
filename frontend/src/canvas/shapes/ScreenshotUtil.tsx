import './shape-types'
import {
  ShapeUtil,
  HTMLContainer,
  Rectangle2d,
  type TLShape,
  resizeBox,
} from 'tldraw'
import { T } from '@tldraw/validate'

export type ScreenshotShape = TLShape<'screenshot'>

export class ScreenshotUtil extends ShapeUtil<ScreenshotShape> {
  static override type = 'screenshot' as const

  static override props = {
    w: T.number,
    h: T.number,
    imageUrl: T.string,
    buildId: T.string,
    timestamp: T.string,
  }

  getDefaultProps(): ScreenshotShape['props'] {
    return {
      w: 400,
      h: 300,
      imageUrl: '',
      buildId: '',
      timestamp: '',
    }
  }

  getGeometry(shape: ScreenshotShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  override canResize() {
    return true
  }

  override isAspectRatioLocked() {
    return true
  }

  override onResize = (shape: any, info: any) => {
    return resizeBox(shape, info)
  }

  component(shape: ScreenshotShape) {
    const { w, h, imageUrl, timestamp } = shape.props

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
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            background: '#fff',
            position: 'relative',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Build screenshot"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontSize: 13,
              }}
            >
              No screenshot
            </div>
          )}

          {/* Built badge */}
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              background: '#22c55e',
              color: 'white',
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <span>Built</span>
            {timestamp && (
              <span style={{ opacity: 0.8, fontWeight: 400 }}>
                {new Date(timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: ScreenshotShape) {
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
