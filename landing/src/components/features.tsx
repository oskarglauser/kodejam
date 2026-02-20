import { Card, CardIcon, CardTitle, CardDescription } from './ui/card'
import { PenLine, MessageSquare, Zap, Camera, Layers, History } from './icons'

export function Features() {
  return (
    <section className="relative mx-auto grid max-w-4xl grid-cols-1 gap-5 px-8 pb-20 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardIcon><PenLine className="h-4 w-4 text-indigo-400" /></CardIcon>
        <CardTitle>Infinite Canvas</CardTitle>
        <CardDescription>
          Sketch wireframes, add sticky notes, draw arrows, and annotate ideas using Excalidraw.
        </CardDescription>
      </Card>
      <Card>
        <CardIcon><MessageSquare className="h-4 w-4 text-indigo-400" /></CardIcon>
        <CardTitle>AI Chat per Page</CardTitle>
        <CardDescription>
          Each page gets its own chat thread. Claude reads your codebase and understands your designs.
        </CardDescription>
      </Card>
      <Card>
        <CardIcon><Zap className="h-4 w-4 text-indigo-400" /></CardIcon>
        <CardTitle>Build from Design</CardTitle>
        <CardDescription>
          Select shapes, generate a build plan, review it, then execute code changes against your repo.
        </CardDescription>
      </Card>
      <Card>
        <CardIcon><Camera className="h-4 w-4 text-indigo-400" /></CardIcon>
        <CardTitle>Live Screenshots</CardTitle>
        <CardDescription>
          Connect to your dev server and capture screenshots directly onto the canvas for annotation.
        </CardDescription>
      </Card>
      <Card>
        <CardIcon><Layers className="h-4 w-4 text-indigo-400" /></CardIcon>
        <CardTitle>Pages & Projects</CardTitle>
        <CardDescription>
          Organize your work into projects and pages. Each page is a separate canvas with its own context.
        </CardDescription>
      </Card>
      <Card>
        <CardIcon><History className="h-4 w-4 text-indigo-400" /></CardIcon>
        <CardTitle>Canvas History</CardTitle>
        <CardDescription>
          Automatic snapshots of your canvas state. Browse and restore previous versions at any time.
        </CardDescription>
      </Card>
    </section>
  )
}
