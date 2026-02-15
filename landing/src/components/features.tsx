import { Card, CardIcon, CardTitle, CardDescription } from './ui/card'
import { PenLine, MessageSquare, Zap } from './icons'

export function Features() {
  return (
    <section className="relative mx-auto grid max-w-4xl grid-cols-1 gap-5 px-8 pb-20 sm:grid-cols-3">
      <Card>
        <CardIcon><PenLine className="h-4 w-4 text-indigo-400" /></CardIcon>
        <CardTitle>Draw</CardTitle>
        <CardDescription>
          Sketch wireframes, drop screenshots, and annotate ideas on an infinite Excalidraw canvas.
        </CardDescription>
      </Card>
      <Card>
        <CardIcon><MessageSquare className="h-4 w-4 text-indigo-400" /></CardIcon>
        <CardTitle>Chat</CardTitle>
        <CardDescription>
          Describe what you want. Claude Code reads your codebase and drafts a step-by-step build plan.
        </CardDescription>
      </Card>
      <Card>
        <CardIcon><Zap className="h-4 w-4 text-indigo-400" /></CardIcon>
        <CardTitle>Build</CardTitle>
        <CardDescription>
          Approve the plan and watch code changes get written to your repo in real time.
        </CardDescription>
      </Card>
    </section>
  )
}
