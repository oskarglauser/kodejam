import { Card, CardIcon, CardTitle, CardDescription } from './ui/card'

const features = [
  {
    icon: '\u270E',
    title: 'Draw',
    description:
      'Sketch wireframes, drop screenshots, and annotate ideas on an infinite Excalidraw canvas.',
  },
  {
    icon: '\u2728',
    title: 'Chat',
    description:
      'Describe what you want. Claude Code reads your codebase and drafts a step-by-step build plan.',
  },
  {
    icon: '\u26A1',
    title: 'Build',
    description:
      'Approve the plan and watch code changes get written to your repo in real time.',
  },
]

export function Features() {
  return (
    <section className="relative mx-auto grid max-w-4xl grid-cols-1 gap-5 px-8 pb-20 sm:grid-cols-3">
      {features.map((f) => (
        <Card key={f.title}>
          <CardIcon>{f.icon}</CardIcon>
          <CardTitle>{f.title}</CardTitle>
          <CardDescription>{f.description}</CardDescription>
        </Card>
      ))}
    </section>
  )
}
