import { Button } from '@/components/ui'

export default function Navbar({ onLoginClick }) {
  const scroll = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <nav
      style={{ background: 'rgba(7,13,23,0.97)', borderBottom: '1px solid var(--br)' }}
      className="flex items-center justify-between px-12 h-16 sticky top-0 z-50 backdrop-blur-md"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="w-8 h-8 bg-az rounded-md flex items-center justify-center font-mono font-bold text-white text-xs">
          ICT
        </div>
        <span className="font-syne font-extrabold text-white text-[17px] tracking-tight">
          ict-cloud.solutions
        </span>
      </div>

      {/* Links */}
      <div className="flex gap-8">
        {[
          ['Services',       'services'],
          ['Azure & AI',     'azure'],
          ['Infrastructure', 'infra'],
          ['Client Portal',  'login'],
        ].map(([label, id]) => (
          <button
            key={id}
            onClick={() => scroll(id)}
            className="font-mono text-[12px] text-mu hover:text-az-light transition-colors bg-transparent border-0 cursor-pointer tracking-wide"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <Button variant="ghost" size="sm" onClick={() => scroll('login')}>
          <i className="ti ti-lock text-sm" /> Client Login
        </Button>
        <Button variant="primary" size="sm">
          Request Access
        </Button>
      </div>
    </nav>
  )
}
