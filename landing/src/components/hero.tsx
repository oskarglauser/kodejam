import { Badge } from './ui/badge'
import { ArrowRight } from './icons'

export function Hero() {
  return (
    <section className="relative mx-auto max-w-4xl px-8 pb-16 pt-20 text-center">
      <div className="mx-auto mb-6 w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </div>

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
        Draw wireframes on an infinite canvas, chat with Claude about your
        codebase, capture live screenshots, and ship working code — all in one tool.
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
