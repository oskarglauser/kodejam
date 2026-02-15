export function Navbar() {
  return (
    <nav className="relative mx-auto flex max-w-5xl items-center justify-between px-8 py-7">
      <div className="text-lg font-bold tracking-tight text-slate-200">
        kode<span className="text-indigo-400">jam</span>
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
