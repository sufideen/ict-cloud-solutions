import Navbar    from '@/components/layout/Navbar'
import InfraBar  from '@/components/layout/InfraBar'
import Footer    from '@/components/layout/Footer'
import Hero      from '@/components/landing/Hero'
import Services  from '@/components/landing/Services'
import LoginForm from '@/components/landing/LoginForm'
import { SectionLabel } from '@/components/ui'

const STACK = [
  {
    id: 'GCP', name: 'Google Cloud', role: '// primary compute',
    color: '#34A853', bg: 'rgba(52,168,83,0.12)', border: 'rgba(52,168,83,0.25)',
    desc: 'GKE for container workloads, Cloud Run for serverless, Cloud SQL for managed data, BigQuery for analytics. EU region by default.',
    pills: ['GKE', 'Cloud Run', 'Cloud SQL', 'BigQuery'],
  },
  {
    id: 'DO',  name: 'DigitalOcean', role: '// secondary / staging',
    color: '#0068DC', bg: 'rgba(0,104,220,0.12)', border: 'rgba(0,104,220,0.25)',
    desc: 'Lightweight secondary layer for staging environments, client preview portals, and auxiliary workloads. Cost-optimised.',
    pills: ['Droplets', 'DOKS', 'Spaces', 'App Platform'],
  },
  {
    id: 'SB',  name: 'Supabase', role: '// auth + db + vector search',
    color: '#3ECF8E', bg: 'rgba(62,207,142,0.12)', border: 'rgba(62,207,142,0.25)',
    desc: 'Auth, Postgres, real-time subscriptions, and pgvector for RAG pipelines. All client data encrypted at rest. Row-level security enforced.',
    pills: ['Auth', 'Postgres', 'pgvector', 'Realtime', 'RLS'],
  },
]

const AZ_PILLS = [
  { dot: '#0078D4', name: 'Azure Kubernetes (AKS)',  type: 'containers · orchestration' },
  { dot: '#50ABF1', name: 'Azure OpenAI',            type: 'GPT-4o · embeddings' },
  { dot: '#00BCF2', name: 'Azure DevOps',            type: 'CI/CD · pipelines' },
  { dot: '#F6821F', name: 'Azure Sentinel',          type: 'SIEM · threat detection' },
  { dot: '#005A9E', name: 'Microsoft Entra ID',      type: 'IAM · RBAC · SSO' },
  { dot: '#3ECF8E', name: 'Azure Monitor',           type: 'observability · alerts' },
  { dot: '#003F72', name: 'Azure SQL / Cosmos',      type: 'managed databases' },
  { dot: '#0078D4', name: 'Azure Landing Zones',     type: 'governance · policy' },
]

export default function LandingPage({ onLogin }) {
  return (
    <div>
      <Navbar onLoginClick={() => document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' })} />
      <InfraBar />
      <Hero onPortalClick={() => document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' })} />
      <Services />

      {/* Hosting Stack */}
      <section id="infra" className="px-12 py-20" style={{ background: 'var(--s2)', borderTop: '1px solid var(--br)', borderBottom: '1px solid var(--br)' }}>
        <SectionLabel>// infrastructure &amp; delivery stack</SectionLabel>
        <h2 className="font-syne font-bold text-[34px] tracking-tight leading-tight mb-2.5">
          Built for resilience. Secured at the edge.
        </h2>
        <p className="text-mu text-sm leading-loose mb-9 max-w-lg">
          Four-layer architecture — compute on GCP and DigitalOcean, data on Supabase, globally protected by Cloudflare.
        </p>
        <div style={{ background: 'var(--br)', border: '1px solid var(--br)' }} className="grid grid-cols-3 gap-[2px] rounded-xl overflow-hidden">
          {STACK.map(s => (
            <div key={s.id} style={{ background: 'var(--s3)' }} className="p-7">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }} className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs">
                  {s.id}
                </div>
                <div>
                  <p className="font-syne font-semibold text-white text-[14px]">{s.name}</p>
                  <p className="font-mono text-[10px] text-mu mt-0.5">{s.role}</p>
                </div>
              </div>
              <p className="text-mu text-[12px] leading-relaxed mb-3.5">{s.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {s.pills.map(p => (
                  <span key={p} style={{ border: '1px solid var(--br)' }} className="px-2 py-0.5 rounded text-[10px] font-mono text-mu">{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Azure specialism */}
      <section id="azure" className="px-12 py-12" style={{ background: 'var(--s)' }}>
        <SectionLabel>// azure services we specialise in</SectionLabel>
        <div className="grid grid-cols-4 gap-2.5 mt-5">
          {AZ_PILLS.map(p => (
            <div
              key={p.name}
              style={{ background: 'var(--s2)', border: '1px solid var(--br)' }}
              className="flex items-center gap-2.5 p-3.5 rounded-lg hover:border-az transition-colors cursor-default"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.dot }} />
              <div>
                <p className="font-mono text-[12px] text-tx">{p.name}</p>
                <p className="font-mono text-[10px] text-mu mt-0.5">{p.type}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <LoginForm onSuccess={onLogin} />
      <Footer />
    </div>
  )
}
