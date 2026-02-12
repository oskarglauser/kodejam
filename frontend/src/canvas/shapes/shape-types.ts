// Module augmentation to register custom shape types with tldraw
declare module '@tldraw/tlschema' {
  interface TLGlobalShapePropsMap {
    'wireframe-box': {
      w: number
      h: number
      label: string
      description: string
      buildStatus: string
      screenshotUrl: string
    }
    'sticky-note': {
      w: number
      h: number
      text: string
      color: string
    }
    'screenshot': {
      w: number
      h: number
      imageUrl: string
      buildId: string
      timestamp: string
    }
  }
}

export {}
