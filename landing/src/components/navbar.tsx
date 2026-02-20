export function Navbar() {
  return (
    <nav className="relative mx-auto flex max-w-5xl items-center justify-between px-8 py-7">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight text-white">kodejam</span>
      </div>
      <a
        href="https://github.com/oskarglauser/kodejam"
        className="text-sm text-slate-400 transition-colors hover:text-slate-200"
      >
        GitHub
      </a>
    </nav>
  )
}
