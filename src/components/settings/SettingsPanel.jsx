import { SectionLabel } from '@/components/ui'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'Not configured'

function Row({ label, desc, value, valueColor }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="flex items-center justify-between py-3">
      <div>
        <p className="text-[13px] text-tx">{label}</p>
        {desc && <p className="font-mono text-[11px] text-mu mt-0.5">{desc}</p>}
      </div>
      <span
        className="font-mono text-[12px] px-2.5 py-1 rounded-md"
        style={{ border: '1px solid var(--br)', color: valueColor || 'var(--az-light)' }}
      >
        {value}
      </span>
    </div>
  )
}

export default function SettingsPanel() {
  return (
    <div className="flex-1 overflow-y-auto p-7">
      <SectionLabel>// configuration</SectionLabel>
      <h2 className="font-syne font-bold text-[22px] tracking-tight mb-7">Portal Settings</h2>

      {/* Domain & DNS */}
      <section className="mb-8">
        <h3 className="font-syne font-semibold text-white text-[14px] pb-2.5 mb-3.5" style={{ borderBottom: '1px solid var(--br)' }}>
          Domain &amp; DNS
        </h3>
        <Row label="Primary domain"  desc="Hosted at ict-cloud.solutions"                      value="ict-cloud.solutions" />
        <Row label="DNS registrar"   desc="GoDaddy → nameservers pointing to Cloudflare"       value="GoDaddy → Cloudflare" valueColor="#F6821F" />
        <Row label="CDN / Edge"      desc="Cloudflare Zero Trust + WAF + DDoS"                 value="Cloudflare"           valueColor="#F6821F" />
        <Row label="SSL Certificate" desc="Managed by Cloudflare, auto-renew enabled"          value="Active · Valid"       valueColor="#4ADE80" />
      </section>

      {/* Supabase */}
      <section className="mb-8">
        <h3 className="font-syne font-semibold text-white text-[14px] pb-2.5 mb-3.5" style={{ borderBottom: '1px solid var(--br)' }}>
          Supabase Integration
        </h3>
        <div style={{ background: 'var(--s3)', border: '1px solid rgba(62,207,142,0.2)' }} className="rounded-xl p-4">
          <h4 className="font-syne font-semibold text-[13px] text-[#3ECF8E] flex items-center gap-2 mb-3">
            <i className="ti ti-database" /> Supabase Project Config
          </h4>
          {[
            ['Project URL',       SUPABASE_URL],
            ['Auth provider',     'Supabase Auth + Google OAuth + Azure AD'],
            ['Database',          'Postgres 15 + pgvector'],
            ['RLS Policies',      'Enforced', '#4ADE80'],
            ['Vector dimensions', '1536 (text-embedding-3-large)'],
            ['Realtime',          'Enabled', '#4ADE80'],
          ].map(([k, v, c]) => (
            <div key={k} className="flex justify-between mb-2 font-mono text-[11px]">
              <span className="text-mu">{k}</span>
              <span style={{ color: c || 'var(--tx)' }} className="truncate max-w-[60%] text-right">{v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* AI Config */}
      <section className="mb-8">
        <h3 className="font-syne font-semibold text-white text-[14px] pb-2.5 mb-3.5" style={{ borderBottom: '1px solid var(--br)' }}>
          AI Configuration
        </h3>
        <Row label="LLM model"       desc="Primary chat model via Edge Function"        value="OpenAI GPT-4o" />
        <Row label="Embedding model" desc="Used for RAG document indexing and search"   value="text-embedding-3-large" />
        <Row label="RAG chunk size"  desc="Characters per document chunk (with overlap)" value="1000 chars" />
        <Row label="Chunk overlap"   desc="Overlap between adjacent chunks"             value="150 chars" />
        <Row label="Top-K retrieval" desc="Max document chunks retrieved per query"     value="5 chunks" />
        <Row label="Match threshold" desc="Min cosine similarity to include a result"   value="0.75" />
      </section>

      {/* DNS migration guide */}
      <section>
        <h3 className="font-syne font-semibold text-white text-[14px] pb-2.5 mb-3.5" style={{ borderBottom: '1px solid var(--br)' }}>
          DNS Migration Guide — GoDaddy → Cloudflare
        </h3>
        <div style={{ background: 'var(--s3)', border: '1px solid var(--br)' }} className="rounded-xl p-4 font-mono text-[12px] text-mu leading-loose">
          <p className="text-az-light mb-2">// GoDaddy → Cloudflare nameserver migration</p>
          <p>1. Login to GoDaddy · go to <em className="text-tx">My Products → DNS</em></p>
          <p>2. Change nameservers to: <span className="text-[#F6821F]">kendra.ns.cloudflare.com / roy.ns.cloudflare.com</span></p>
          <p>3. In Cloudflare: Add site → ict-cloud.solutions → select plan</p>
          <p>4. Import DNS records from GoDaddy (auto-scanned)</p>
          <p>5. Enable Cloudflare Proxy (orange cloud) on A/CNAME records</p>
          <p>6. Set SSL/TLS mode to <span className="text-green-400">Full (Strict)</span></p>
          <p>7. Enable Zero Trust → Access → protect /dashboard route</p>
          <p className="text-tx mt-2">Propagation: 24–48h after nameserver change.</p>
        </div>
      </section>
    </div>
  )
}
