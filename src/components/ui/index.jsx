// src/components/ui/index.jsx
// Shared primitive components — used across landing and dashboard

export function Button({ children, variant = 'primary', size = 'md', className = '', onClick, disabled, type = 'button' }) {
  const base = 'inline-flex items-center gap-2 font-mono rounded-md transition-colors cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-az hover:bg-az-dark text-white',
    ghost:   'bg-transparent border border-[var(--br)] text-mu hover:border-az hover:text-az-light',
    danger:  'bg-[var(--danger)] hover:bg-red-700 text-white',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-[11px]',
    md: 'px-4 py-2 text-[12px]',
    lg: 'px-6 py-3 text-[13px]',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Badge({ children, color = 'azure', className = '' }) {
  const colors = {
    azure:     'border-[rgba(0,120,212,0.4)] text-az-light bg-[rgba(0,120,212,0.08)]',
    green:     'border-[rgba(22,163,74,0.4)] text-green-400 bg-[rgba(22,163,74,0.08)]',
    orange:    'border-[rgba(246,130,31,0.4)] text-[#F6821F] bg-[rgba(246,130,31,0.06)]',
    yellow:    'border-[rgba(234,179,8,0.4)] text-yellow-400 bg-[rgba(234,179,8,0.08)]',
    red:       'border-[rgba(220,38,38,0.4)] text-red-400 bg-[rgba(220,38,38,0.08)]',
    supabase:  'border-[rgba(62,207,142,0.4)] text-[#3ECF8E] bg-[rgba(62,207,142,0.06)]',
    muted:     'border-[var(--br)] text-mu',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded text-[10px] font-mono ${colors[color]} ${className}`}>
      {children}
    </span>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-s3 border border-[var(--br)] rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

export function PulseDot({ color = '#4ADE80' }) {
  return (
    <span
      className="pulse inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ background: color }}
    />
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div className="relative w-9 h-5">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <div
          className={`absolute inset-0 rounded-full transition-colors duration-200 ${checked ? 'bg-az' : 'bg-[rgba(255,255,255,0.1)]'}`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`}
        />
      </div>
      {label && <span className="text-xs font-mono text-mu">{label}</span>}
    </label>
  )
}

export function SectionLabel({ children }) {
  return (
    <p className="font-mono text-[10px] tracking-[2px] text-az uppercase mb-2.5">
      {children}
    </p>
  )
}

export function Divider() {
  return <hr className="border-[var(--br)]" />
}
