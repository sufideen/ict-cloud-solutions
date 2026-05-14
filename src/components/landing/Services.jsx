import { SectionLabel } from '@/components/ui'

const services = [
  { icon: 'ti-cloud',        title: 'Azure Architecture',           tag: 'DESIGN + DEPLOY', desc: 'Landing zones, hub-spoke networks, subscription governance, and enterprise-scale blueprint design.' },
  { icon: 'ti-brain',        title: 'AI & ML Integration',          tag: 'AI-POWERED',      desc: 'Azure OpenAI, Cognitive Services, RAG pipelines with Supabase pgvector, and intelligent workflow automation.' },
  { icon: 'ti-shield-lock',  title: 'Security & Compliance',        tag: 'ZERO TRUST',      desc: 'Zero-trust architecture, Cloudflare WAF, Microsoft Defender, Sentinel SIEM, and regulatory framework alignment.' },
  { icon: 'ti-server',       title: 'Infrastructure Support',       tag: '24/7 MANAGED',    desc: '24/7 managed infrastructure, IaC with Bicep/Terraform, patching, monitoring, and incident response.' },
  { icon: 'ti-refresh',      title: 'Migration & Modernisation',    tag: 'MIGRATION',       desc: 'Lift-and-shift, re-platforming, and cloud-native refactoring for legacy estates and on-prem workloads.' },
  { icon: 'ti-database',     title: 'Data & AI Knowledge Bases',    tag: 'RAG + VECTOR DB', desc: 'Supabase-backed RAG systems, vector search, document ingestion pipelines, and semantic retrieval for enterprise AI.' },
]

export default function Services() {
  return (
    <section id="services" className="px-12 py-20" style={{ background: 'var(--s)' }}>
      <SectionLabel>{'// what we do'}</SectionLabel>
      <h2 className="font-syne font-bold text-[34px] tracking-tight leading-tight mb-2.5">
        End-to-end Azure & AI support
      </h2>
      <p className="text-mu text-sm leading-loose mb-11 max-w-lg">
        From architecture design to live infrastructure management — every layer of your cloud stack, covered.
      </p>

      <div
        style={{ border: '1px solid var(--br)', background: 'var(--br)' }}
        className="grid grid-cols-3 gap-[2px] rounded-xl overflow-hidden"
      >
        {services.map(s => (
          <div
            key={s.title}
            style={{ background: 'var(--s2)' }}
            className="p-7 hover:bg-s3 transition-colors"
          >
            <div
              style={{ background: 'rgba(0,120,212,0.1)', border: '1px solid rgba(0,120,212,0.2)' }}
              className="w-10 h-10 rounded-[9px] flex items-center justify-center mb-4 text-az-light text-lg"
            >
              <i className={`ti ${s.icon}`} />
            </div>
            <h3 className="font-syne font-semibold text-white text-[15px] mb-2">{s.title}</h3>
            <p className="text-mu text-[12px] leading-relaxed">{s.desc}</p>
            <span
              style={{ background: 'rgba(0,120,212,0.1)', border: '1px solid rgba(0,120,212,0.2)' }}
              className="inline-block mt-3.5 px-2 py-0.5 rounded text-[10px] font-mono text-az-light tracking-wide"
            >
              {s.tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
