import { Card } from '@/components/ui'

const metrics = [
  { label: 'ACTIVE SERVICES', value: '14', unit: ' svc',  trend: '+2 this month', up: true },
  { label: 'UPTIME (30d)',     value: '99.97', unit: '%', trend: 'SLA met',        up: true },
  { label: 'OPEN TICKETS',    value: '3', unit: ' open',  trend: '1 high priority', up: false },
  { label: 'RAG DOCUMENTS',   value: '48', unit: ' docs', trend: '3 indexing',    up: true },
]

const tickets = [
  { priority: '#F87171', title: 'AKS node pool scaling issue — prod', status: 'In Progress', statusColor: '#EAB308' },
  { priority: '#EAB308', title: 'Azure OpenAI quota increase request', status: 'Open', statusColor: '#50ABF1' },
  { priority: '#4ADE80', title: 'Cloudflare WAF rule review', status: 'Resolved', statusColor: '#4ADE80' },
  { priority: '#4ADE80', title: 'Supabase RLS policy audit', status: 'Resolved', statusColor: '#4ADE80' },
  { priority: '#EAB308', title: 'Entra ID SSO group mapping update', status: 'Open', statusColor: '#50ABF1' },
]

const resources = [
  { name: 'CPU (GKE cluster)',     pct: 62, color: 'var(--az)' },
  { name: 'Memory',                pct: 74, color: '#EAB308' },
  { name: 'Azure SQL DTU',         pct: 38, color: '#4ADE80' },
  { name: 'Supabase DB',           pct: 29, color: '#3ECF8E' },
  { name: 'Cloudflare Bandwidth',  pct: 51, color: '#F6821F' },
]

export default function Overview({ onNav }) {
  return (
    <div className="flex-1 overflow-y-auto p-7">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {metrics.map(m => (
          <div key={m.label} style={{ background: 'var(--s3)', border: '1px solid var(--br)' }} className="rounded-xl p-4">
            <p className="font-mono text-[10px] text-mu tracking-wide mb-2">{m.label}</p>
            <p className="font-syne font-bold text-white text-[26px]">
              {m.value}<span className="text-az-light text-sm">{m.unit}</span>
            </p>
            <p className={`font-mono text-[10px] mt-1.5 ${m.up ? 'text-green-400' : 'text-red-400'}`}>
              <i className={`ti ${m.up ? 'ti-trending-up' : 'ti-alert-circle'} text-[11px]`} /> {m.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Tickets */}
        <Card>
          <p className="font-syne font-semibold text-white text-[13px] flex items-center gap-2 mb-3.5">
            <i className="ti ti-ticket text-az-light text-[15px]" /> Recent Support Tickets
          </p>
          {tickets.map((t, i) => (
            <div key={i} style={{ borderBottom: i < tickets.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }} className="flex items-center gap-2.5 py-2">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.priority }} />
              <span className="text-[12px] text-tx flex-1">{t.title}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: `${t.statusColor}22`, color: t.statusColor }}>{t.status}</span>
            </div>
          ))}
          <button
            onClick={() => onNav('tickets')}
            style={{ border: '1px solid var(--br)', marginTop: '14px' }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-mono text-mu hover:border-az hover:text-az-light transition-colors bg-transparent cursor-pointer"
          >
            <i className="ti ti-ticket" /> View All Tickets
          </button>
        </Card>

        {/* Resources */}
        <Card>
          <p className="font-syne font-semibold text-white text-[13px] flex items-center gap-2 mb-3.5">
            <i className="ti ti-server text-az-light text-[15px]" /> Resource Utilisation
          </p>
          {resources.map(r => (
            <div key={r.name} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[11px] text-mu">{r.name}</span>
                <span className="font-mono text-[11px] text-tx">{r.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${r.pct}%`, background: r.color }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* AI sessions */}
        <Card>
          <p className="font-syne font-semibold text-white text-[13px] flex items-center gap-2 mb-3.5">
            <i className="ti ti-brain text-az-light text-[15px]" /> AI Assistant — Recent Sessions
          </p>
          {[
            ['How do I scale AKS node pools?', '2h ago'],
            ['Explain our DR runbook (RAG)',    'Yesterday'],
            ['Azure Sentinel alert triage',     '2d ago'],
          ].map(([q, t]) => (
            <div key={q} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="flex justify-between py-1.5 font-mono text-[12px]">
              <span className="text-mu">{q}</span>
              <span className="text-az-light text-[10px]">{t}</span>
            </div>
          ))}
          <button
            onClick={() => onNav('chat')}
            style={{ border: '1px solid var(--br)', marginTop: '14px' }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-mono text-mu hover:border-az hover:text-az-light transition-colors bg-transparent cursor-pointer"
          >
            <i className="ti ti-message-chatbot" /> Open AI Assistant
          </button>
        </Card>

        {/* RAG */}
        <Card>
          <p className="font-syne font-semibold text-white text-[13px] flex items-center gap-2 mb-3.5">
            <i className="ti ti-books text-az-light text-[15px]" /> Knowledge Base (RAG)
          </p>
          {[
            ['48 documents indexed',     '● Healthy', '#4ADE80'],
            ['Vector store (pgvector)', 'Supabase', '#3ECF8E'],
            ['Last ingestion',          '3h ago',   '#50ABF1'],
          ].map(([k, v, c]) => (
            <div key={k} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="flex justify-between py-1.5 font-mono text-[12px]">
              <span className="text-mu">{k}</span>
              <span style={{ color: c }}>{v}</span>
            </div>
          ))}
          <button
            onClick={() => onNav('rag')}
            style={{ border: '1px solid var(--br)', marginTop: '14px' }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-mono text-mu hover:border-az hover:text-az-light transition-colors bg-transparent cursor-pointer"
          >
            <i className="ti ti-books" /> Manage Knowledge Base
          </button>
        </Card>
      </div>
    </div>
  )
}
