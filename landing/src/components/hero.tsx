import { Badge } from './ui/badge'
import { ArrowRight } from './icons'

export function Hero() {
  return (
    <section className="relative mx-auto max-w-4xl px-8 pb-16 pt-20 text-center">
      <Badge className="mb-10">
        A visual frontend for Claude Code
        <ArrowRight className="h-3.5 w-3.5" />
      </Badge>

      <h1 className="bg-gradient-to-b from-slate-100 via-slate-100 to-slate-500/60 bg-clip-text text-[clamp(3rem,8vw,5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-transparent">
        Sketch it, describe it,
        <br />
        ship it
      </h1>

      <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
        Draw wireframes on a canvas, chat with Claude Code about your
        codebase, and watch your ideas turn into working code.
      </p>

      <a
        href="https://github.com/oskarglauser/kodejam"
        className="mt-10 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:brightness-110"
      >
        Get started
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </a>
    </section>
  )
}
