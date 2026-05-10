const badges = [
  { label: 'AZURE PARTNER',    color: 'rgba(0,120,212,0.4)',   text: '#50ABF1' },
  { label: 'SOC 2 TYPE II',    color: 'var(--br)',              text: 'var(--mu)' },
  { label: 'ISO 27001',        color: 'var(--br)',              text: 'var(--mu)' },
  { label: 'CLOUDFLARE EDGE',  color: 'rgba(246,130,31,0.3)',   text: '#F6821F' },
  { label: 'GCP',              color: 'rgba(52,168,83,0.3)',    text: '#34A853' },
  { label: 'DIGITALOCEAN',     color: 'rgba(0,104,220,0.3)',    text: '#0068DC' },
  { label: 'SUPABASE',         color: 'rgba(62,207,142,0.3)',   text: '#3ECF8E' },
]

export default function Footer() {
  return (
    <footer
      style={{ background: 'var(--s2)', borderTop: '1px solid var(--br)' }}
      className="flex justify-between items-end px-12 py-9"
    >
      <div>
        <p className="font-syne font-bold text-white text-[15px]">ict-cloud.solutions</p>
        <p className="font-mono text-[10px] text-mu mt-0.5">
          Azure & AI Consultancy · DNS: GoDaddy → Cloudflare · © {new Date().getFullYear()}
        </p>
        <div className="flex gap-2 mt-2.5 flex-wrap">
          {badges.map(b => (
            <span
              key={b.label}
              style={{ border: `1px solid ${b.color}`, color: b.text }}
              className="px-2 py-0.5 rounded text-[10px] font-mono"
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-5">
        {['Services', 'Security', 'Privacy Policy', 'Contact'].map(l => (
          <span key={l} className="text-[11px] font-mono text-mu hover:text-az-light cursor-pointer transition-colors">
            {l}
          </span>
        ))}
      </div>
    </footer>
  )
}
