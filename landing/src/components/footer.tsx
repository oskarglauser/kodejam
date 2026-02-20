export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-8 text-center text-sm text-slate-600">
      <span>Kodejam is open source.</span>
      {' '}
      <a
        href="https://github.com/oskarglauser/kodejam"
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-400 hover:text-slate-200 transition-colors"
      >
        View on GitHub
      </a>
    </footer>
  )
}
