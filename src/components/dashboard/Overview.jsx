import { useState, useEffect } from 'react'
import { Card } from '@/components/ui'
import { fetchTickets, fetchDocuments, fetchRecentUserMessages } from '@/lib/supabase'

const STATIC_METRICS = [
  { label: 'ACTIVE SERVICES', value: '14', unit: ' svc',  trend: '+2 this month', up: true },
  { label: 'UPTIME (30d)',     value: '99.97', unit: '%', trend: 'SLA met',        up: true },
]

const priorityColor = { HIGH: '#F87171', MEDIUM: '#EAB308', LOW: '#4ADE80' }
const statusStyle   = {
  'Open':        { bg: 'rgba(0,120,212,0.15)',  text: '#50ABF1' },
  'In Progress': { bg: 'rgba(234,179,8,0.15)',  text: '#EAB308' },
  'Resolved':    { bg: 'rgba(22,163,74,0.15)',  text: '#4ADE80' },
}

const resources = [
  { name: 'CPU (GKE cluster)',    pct: 62, color: 'var(--az)' },
  { name: 'Memory',               pct: 74, color: '#EAB308' },
  { name: 'Azure SQL DTU',        pct: 38, color: '#4ADE80' },
  { name: 'Supabase DB',          pct: 29, color: '#3ECF8E' },
  { name: 'Cloudflare Bandwidth', pct: 51, color: '#F6821F' },
]

function fmtRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000)       return 'just now'
  if (diff < 3_600_000)    return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000)   return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 604_800_000)  return `${Math.floor(diff / 86_400_000)}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function Overview({ onNav }) {
  const [tickets,   setTickets]   = useState([])
  const [documents, setDocuments] = useState([])
  const [sessions,  setSessions]  = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const [ticketRes, docRes, sessionRes] = await Promise.all([
        fetchTickets(),
        fetchDocuments(),
        fetchRecentUserMessages(5),
      ])
      setTickets(ticketRes.data  ?? [])
      setDocuments(docRes.data   ?? [])
      setSessions(sessionRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const openCount     = tickets.filter(t => t.status !== 'Resolved').length
  const highPriCount  = tickets.filter(t => t.priority === 'HIGH' && t.status !== 'Resolved').length
  const indexedDocs   = documents.filter(d => d.status === 'indexed').length
  const processingDocs = documents.filter(d => d.status === 'processing').length
  const recentTickets = tickets.slice(0, 5)

  const dynamicMetrics = [
    ...STATIC_METRICS,
    {
      label: 'OPEN TICKETS',
      value: loading ? '—' : String(openCount),
      unit:  ' open',
      trend: loading ? '' : highPriCount > 0 ? `${highPriCount} high priority` : 'All normal priority',
      up:    highPriCount === 0,
    },
    {
      label: 'RAG DOCUMENTS',
      value: loading ? '—' : String(documents.length),
      unit:  ' docs',
      trend: loading ? '' : processingDocs > 0 ? `${processingDocs} indexing` : `${indexedDocs} indexed`,
      up:    true,
    },
  ]

  const lastIngestion = documents.length > 0
    ? fmtRelative(documents[0].created_at)
    : 'No documents yet'

  return (
    <div className="flex-1 overflow-y-auto p-7">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {dynamicMetrics.map(m => (
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
          {loading ? (
            <div className="flex items-center gap-2 font-mono text-[11px] text-mu py-4">
              <i className="ti ti-loader-2 animate-spin" /> Loading tickets...
            </div>
          ) : recentTickets.length === 0 ? (
            <p className="font-mono text-[11px] text-mu py-4">No tickets yet.</p>
          ) : (
            recentTickets.map((t, i) => (
              <div key={t.id} style={{ borderBottom: i < recentTickets.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }} className="flex items-center gap-2.5 py-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: priorityColor[t.priority] ?? '#6B7280' }} />
                <span className="text-[12px] text-tx flex-1 truncate">{t.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded flex-shrink-0"
                  style={{ background: statusStyle[t.status]?.bg ?? 'rgba(107,114,128,0.15)', color: statusStyle[t.status]?.text ?? '#6B7280' }}>
                  {t.status}
                </span>
              </div>
            ))
          )}
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
          {loading ? (
            <div className="flex items-center gap-2 font-mono text-[11px] text-mu py-4">
              <i className="ti ti-loader-2 animate-spin" /> Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <p className="font-mono text-[11px] text-mu py-4">No sessions yet — start a chat.</p>
          ) : (
            sessions.map((s, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="flex justify-between py-1.5 font-mono text-[12px]">
                <span className="text-mu truncate max-w-[75%]">{s.content}</span>
                <span className="text-az-light text-[10px] flex-shrink-0 ml-2">{fmtRelative(s.created_at)}</span>
              </div>
            ))
          )}
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
            [loading ? '— documents' : `${indexedDocs} document${indexedDocs !== 1 ? 's' : ''} indexed`,
              indexedDocs > 0 ? '● Healthy' : '○ Empty', indexedDocs > 0 ? '#4ADE80' : '#6B7280'],
            ['Vector store (pgvector)', 'Supabase', '#3ECF8E'],
            ['Last ingestion', lastIngestion, '#50ABF1'],
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
