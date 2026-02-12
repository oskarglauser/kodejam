import '../shapes/shape-types'
import { StateNode, type TLEventHandlers, createShapeId } from 'tldraw'

class Idle extends StateNode {
  static override id = 'idle'

  override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
    this.parent.transition('pointing', info)
  }
}

class Pointing extends StateNode {
  static override id = 'pointing'

  override onPointerUp: TLEventHandlers['onPointerUp'] = (_info) => {
    const { editor } = this
    const { currentPagePoint } = editor.inputs

    const id = createShapeId()
    editor.createShape({
      id,
      type: 'sticky-note',
      x: currentPagePoint.x - 90,
      y: currentPagePoint.y - 60,
      props: { w: 180, h: 120 },
    })
    editor.setSelectedShapes([id])
    editor.setCurrentTool('select')
  }

  override onPointerMove: TLEventHandlers['onPointerMove'] = () => {
    if (this.editor.inputs.isDragging) {
      this.parent.transition('dragging')
    }
  }

  override onCancel = () => {
    this.parent.transition('idle')
  }
}

class Dragging extends StateNode {
  static override id = 'dragging'

  shapeId = createShapeId()

  override onEnter = () => {
    const { editor } = this
    const { originPagePoint } = editor.inputs

    this.shapeId = createShapeId()
    editor.createShape({
      id: this.shapeId,
      type: 'sticky-note',
      x: originPagePoint.x,
      y: originPagePoint.y,
      props: { w: 1, h: 1 },
    })
  }

  override onPointerMove: TLEventHandlers['onPointerMove'] = () => {
    const { editor } = this
    const { originPagePoint, currentPagePoint } = editor.inputs

    const x = Math.min(originPagePoint.x, currentPagePoint.x)
    const y = Math.min(originPagePoint.y, currentPagePoint.y)
    const w = Math.abs(currentPagePoint.x - originPagePoint.x)
    const h = Math.abs(currentPagePoint.y - originPagePoint.y)

    editor.updateShape({
      id: this.shapeId,
      type: 'sticky-note',
      x,
      y,
      props: { w: Math.max(w, 20), h: Math.max(h, 20) },
    })
  }

  override onPointerUp: TLEventHandlers['onPointerUp'] = () => {
    const { editor } = this
    editor.setSelectedShapes([this.shapeId])
    editor.setCurrentTool('select')
  }

  override onCancel = () => {
    this.editor.deleteShape(this.shapeId)
    this.parent.transition('idle')
  }
}

export class StickyNoteTool extends StateNode {
  static override id = 'sticky-note'
  static override initial = 'idle'
  static override children = () => [Idle, Pointing, Dragging]
}
