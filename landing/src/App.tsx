import { Navbar } from './components/navbar'
import { Hero } from './components/hero'
import { Features } from './components/features'
import { Footer } from './components/footer'

export function App() {
  return (
    <div className="relative min-h-screen">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(99,102,241,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 55% 20%, rgba(139,92,246,0.08) 0%, transparent 60%)',
        }}
      />

      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </div>
  )
}
