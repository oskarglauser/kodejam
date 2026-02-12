import './shape-types'
import {
  ShapeUtil,
  HTMLContainer,
  Rectangle2d,
  type TLShape,
  resizeBox,
} from 'tldraw'
import { T } from '@tldraw/validate'

export type StickyNoteShape = TLShape<'sticky-note'>

const colorMap: Record<string, { bg: string; border: string }> = {
  yellow: { bg: '#fef9c3', border: '#fde047' },
  blue: { bg: '#dbeafe', border: '#93c5fd' },
  green: { bg: '#dcfce7', border: '#86efac' },
  pink: { bg: '#fce7f3', border: '#f9a8d4' },
  purple: { bg: '#f3e8ff', border: '#d8b4fe' },
}

export class StickyNoteUtil extends ShapeUtil<StickyNoteShape> {
  static override type = 'sticky-note' as const

  static override props = {
    w: T.number,
    h: T.number,
    text: T.string,
    color: T.string,
  }

  getDefaultProps(): StickyNoteShape['props'] {
    return {
      w: 180,
      h: 120,
      text: '',
      color: 'yellow',
    }
  }

  getGeometry(shape: StickyNoteShape) {
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

  component(shape: StickyNoteShape) {
    const { w, h, text, color } = shape.props
    const isEditing = this.editor.getEditingShapeId() === shape.id
    const colors = colorMap[color] ?? colorMap.yellow

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
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: 4,
            padding: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {isEditing ? (
            <textarea
              autoFocus
              defaultValue={text}
              onBlur={(e) => {
                const newText = e.target.value
                this.editor.updateShape<StickyNoteShape>({
                  id: shape.id,
                  type: 'sticky-note',
                  props: { text: newText },
                })
                this.editor.setEditingShape(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.blur()
                }
                e.stopPropagation()
              }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                fontSize: 13,
                color: '#374151',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                padding: 0,
                lineHeight: 1.5,
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <div
              style={{
                fontSize: 13,
                color: '#374151',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                overflow: 'hidden',
              }}
            >
              {text || 'Double-click to edit...'}
            </div>
          )}
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: StickyNoteShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={4}
        ry={4}
        fill="none"
      />
    )
  }
}
