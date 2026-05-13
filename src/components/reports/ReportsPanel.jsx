import { useState, useEffect } from 'react'
import { SectionLabel } from '@/components/ui'
import { fetchTickets, fetchDocuments, fetchRecentUserMessages } from '@/lib/supabase'

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--s3)', border: '1px solid var(--br)' }} className="rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <i className={`ti ${icon} text-base`} style={{ color: color ?? 'var(--az-light)' }} />
        <p className="font-mono text-[10px] text-mu tracking-wide">{label}</p>
      </div>
      <p className="font-syne font-bold text-white text-[28px]">{value}</p>
      {sub && <p className="font-mono text-[10px] text-mu mt-1">{sub}</p>}
    </div>
  )
}

function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="font-mono text-[11px] text-mu">{label}</span>
        <span className="font-mono text-[11px] text-tx">{value}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function ReportsPanel() {
  const [tickets,   setTickets]   = useState([])
  const [documents, setDocuments] = useState([])
  const [sessions,  setSessions]  = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const [t, d, s] = await Promise.all([
        fetchTickets(),
        fetchDocuments(),
        fetchRecentUserMessages(50),
      ])
      setTickets(t.data   ?? [])
      setDocuments(d.data ?? [])
      setSessions(s.data  ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Ticket breakdowns
  const byStatus = {
    Open:        tickets.filter(t => t.status === 'Open').length,
    'In Progress': tickets.filter(t => t.status === 'In Progress').length,
    Resolved:    tickets.filter(t => t.status === 'Resolved').length,
  }
  const byPriority = {
    HIGH:   tickets.filter(t => t.priority === 'HIGH').length,
    MEDIUM: tickets.filter(t => t.priority === 'MEDIUM').length,
    LOW:    tickets.filter(t => t.priority === 'LOW').length,
  }
  const maxStatus   = Math.max(...Object.values(byStatus), 1)
  const maxPriority = Math.max(...Object.values(byPriority), 1)

  // Document breakdowns
  const indexedDocs    = documents.filter(d => d.status === 'indexed').length
  const processingDocs = documents.filter(d => d.status === 'processing').length
  const totalChunks    = documents.reduce((sum, d) => sum + (d.chunk_count ?? 0), 0)

  // Last 7 days activity
  const sevenDaysAgo = Date.now() - 7 * 86_400_000
  const recentTickets  = tickets.filter(t => new Date(t.created_at).getTime() > sevenDaysAgo).length
  const recentDocs     = documents.filter(d => new Date(d.created_at).getTime() > sevenDaysAgo).length
  const recentMessages = sessions.filter(s => new Date(s.created_at).getTime() > sevenDaysAgo).length

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="font-mono text-mu text-sm flex items-center gap-2">
          <i className="ti ti-loader-2 animate-spin text-az text-lg" /> Loading reports...
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-7">
      <SectionLabel>// analytics</SectionLabel>
      <h2 className="font-syne font-bold text-[22px] tracking-tight mb-6">Reports</h2>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 mb-7">
        <StatCard icon="ti-ticket"        label="TOTAL TICKETS"    value={tickets.length}   sub={`${byStatus.Open} open · ${byStatus.Resolved} resolved`} />
        <StatCard icon="ti-file-text"     label="TOTAL DOCUMENTS"  value={documents.length} sub={`${indexedDocs} indexed · ${totalChunks} chunks`}        color="#3ECF8E" />
        <StatCard icon="ti-message-chatbot" label="AI QUERIES (ALL)" value={sessions.length} sub="Total user messages"                                    color="#50ABF1" />
        <StatCard icon="ti-trending-up"   label="LAST 7 DAYS"      value={recentMessages}   sub={`${recentTickets} tickets · ${recentDocs} docs`}         color="#F6821F" />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-7">
        {/* Tickets by status */}
        <div style={{ background: 'var(--s3)', border: '1px solid var(--br)' }} className="rounded-xl p-5">
          <p className="font-syne font-semibold text-white text-[13px] flex items-center gap-2 mb-4">
            <i className="ti ti-ticket text-az-light" /> Tickets by Status
          </p>
          <BarRow label="Open"        value={byStatus.Open}          max={maxStatus} color="var(--az)" />
          <BarRow label="In Progress" value={byStatus['In Progress']} max={maxStatus} color="#EAB308" />
          <BarRow label="Resolved"    value={byStatus.Resolved}      max={maxStatus} color="#4ADE80" />
        </div>

        {/* Tickets by priority */}
        <div style={{ background: 'var(--s3)', border: '1px solid var(--br)' }} className="rounded-xl p-5">
          <p className="font-syne font-semibold text-white text-[13px] flex items-center gap-2 mb-4">
            <i className="ti ti-alert-triangle text-az-light" /> Tickets by Priority
          </p>
          <BarRow label="High"   value={byPriority.HIGH}   max={maxPriority} color="#F87171" />
          <BarRow label="Medium" value={byPriority.MEDIUM} max={maxPriority} color="#EAB308" />
          <BarRow label="Low"    value={byPriority.LOW}    max={maxPriority} color="#4ADE80" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Knowledge base */}
        <div style={{ background: 'var(--s3)', border: '1px solid var(--br)' }} className="rounded-xl p-5">
          <p className="font-syne font-semibold text-white text-[13px] flex items-center gap-2 mb-4">
            <i className="ti ti-books text-az-light" /> Knowledge Base
          </p>
          {[
            ['Indexed documents',   indexedDocs,    '#4ADE80'],
            ['Processing',          processingDocs, '#EAB308'],
            ['Total vector chunks', totalChunks,    '#50ABF1'],
            ['Added last 7 days',   recentDocs,     '#F6821F'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="flex justify-between py-2 font-mono text-[12px]">
              <span className="text-mu">{label}</span>
              <span style={{ color }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Recent AI queries */}
        <div style={{ background: 'var(--s3)', border: '1px solid var(--br)' }} className="rounded-xl p-5">
          <p className="font-syne font-semibold text-white text-[13px] flex items-center gap-2 mb-4">
            <i className="ti ti-brain text-az-light" /> Recent AI Queries
          </p>
          {sessions.length === 0 ? (
            <p className="font-mono text-[11px] text-mu py-4">No AI sessions yet.</p>
          ) : (
            sessions.slice(0, 6).map((s, i) => (
              <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="py-2">
                <p className="font-mono text-[11px] text-tx truncate">{s.content}</p>
                <p className="font-mono text-[10px] text-mu mt-0.5">
                  {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
