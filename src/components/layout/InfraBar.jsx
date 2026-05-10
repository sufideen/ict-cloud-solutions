import { PulseDot } from '@/components/ui'

const providers = [
  { label: 'Google Cloud Platform', color: '#34A853' },
  { label: 'DigitalOcean',          color: '#0068DC' },
  { label: 'Cloudflare CDN + Zero Trust', color: '#F6821F' },
  { label: 'Supabase (Auth + DB + Vector)', color: '#3ECF8E' },
]

export default function InfraBar() {
  return (
    <div
      style={{ background: 'var(--s2)', borderBottom: '1px solid var(--br)' }}
      className="flex items-center gap-5 px-12 py-2.5"
    >
      <span className="font-mono text-[10px] tracking-widest text-mu">// hosted on</span>

      <div className="flex gap-3">
        {providers.map((p, i) => (
          <span
            key={i}
            style={{ border: '1px solid var(--br)' }}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-mono text-tx"
          >
            <PulseDot color={p.color} />
            {p.label}
          </span>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-mu">
        <PulseDot />
        All systems operational
      </div>
    </div>
  )
}
