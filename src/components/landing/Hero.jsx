import { PulseDot } from '@/components/ui'

export default function Hero({ onPortalClick }) {
  const scroll = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="relative px-12 pt-24 pb-20 overflow-hidden" style={{ background: 'var(--s)' }}>
      <div className="absolute inset-0 hero-grid" />
      {/* Radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-120px', left: '46%', transform: 'translateX(-50%)',
          width: '640px', height: '440px',
          background: 'radial-gradient(ellipse, rgba(0,120,212,0.16) 0%, transparent 68%)',
        }}
      />

      <div className="relative max-w-2xl">
        {/* Badge */}
        <div
          style={{ border: '1px solid rgba(80,171,241,0.3)', background: 'rgba(80,171,241,0.05)' }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7"
        >
          <PulseDot />
          <span className="font-mono text-[11px] text-az-light">
            Microsoft Azure Advanced Partner &nbsp;·&nbsp; AI-Ready Infrastructure
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-syne font-extrabold text-white leading-[1.04] tracking-[-2.5px] mb-5" style={{ fontSize: '56px' }}>
          Enterprise cloud<br />that{' '}
          <span className="text-az-light">thinks</span> ahead
        </h1>

        <p className="text-mu text-[16px] leading-loose mb-9 max-w-xl font-light">
          Specialist Azure and AI consultancy delivering enterprise infrastructure, intelligent automation,
          RAG-powered knowledge systems, and secure cloud transformation — exclusively for verified clients
          at <span className="text-az-light font-medium">ict-cloud.solutions</span>.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => scroll('services')}
            className="flex items-center gap-2 px-7 py-3 bg-az hover:bg-az-dark text-white font-mono text-[13px] font-medium rounded-lg transition-colors"
          >
            <i className="ti ti-player-play" /> Explore Services
          </button>
          <button
            onClick={onPortalClick}
            style={{ border: '1px solid var(--br)' }}
            className="flex items-center gap-2 px-7 py-3 bg-transparent hover:border-az text-mu hover:text-az-light font-mono text-[13px] rounded-lg transition-colors"
          >
            <i className="ti ti-lock" /> Client Portal
          </button>
        </div>

        {/* Stats */}
        <div
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          className="flex gap-12 mt-14 pt-10"
        >
          {[
            ['140+',    '// cloud deployments'],
            ['99.97%',  '// uptime delivered'],
            ['12yr',    '// azure expertise'],
            ['SOC2 ✓',  '// certified & compliant'],
          ].map(([val, lbl]) => (
            <div key={lbl}>
              <p className="font-syne font-bold text-white text-3xl">{val}</p>
              <p className="font-mono text-[11px] text-mu mt-0.5 tracking-wide">{lbl}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
