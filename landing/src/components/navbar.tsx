export function Navbar() {
  return (
    <nav className="relative mx-auto flex max-w-5xl items-center justify-between px-8 py-7">
      <div className="text-xl font-bold tracking-tight text-white">
        kodejam
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
