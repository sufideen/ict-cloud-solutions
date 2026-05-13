import { useState, useEffect } from 'react'
import { SectionLabel } from '@/components/ui'
import { useAuth } from '@/lib/AuthContext'
import { fetchTickets, createTicket } from '@/lib/supabase'

const priorityColor = { HIGH: '#F87171', MEDIUM: '#EAB308', LOW: '#4ADE80' }
const statusStyle   = {
  'Open':        { bg: 'rgba(0,120,212,0.15)',  text: '#50ABF1' },
  'In Progress': { bg: 'rgba(234,179,8,0.15)',  text: '#EAB308' },
  'Resolved':    { bg: 'rgba(22,163,74,0.15)',  text: '#4ADE80' },
}

function fmtRelative(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000)      return 'just now'
  if (diff < 3_600_000)   return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000)  return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function TicketsPanel() {
  const { user }                      = useAuth()
  const [tickets,    setTickets]      = useState([])
  const [loading,    setLoading]      = useState(true)
  const [error,      setError]        = useState(null)
  const [filter,     setFilter]       = useState('All')
  const [showModal,  setShowModal]    = useState(false)

  // New ticket form state
  const [newTitle,    setNewTitle]    = useState('')
  const [newPriority, setNewPriority] = useState('MEDIUM')
  const [submitting,  setSubmitting]  = useState(false)
  const [formError,   setFormError]   = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await fetchTickets()
    if (err) setError(err.message)
    else setTickets(data ?? [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newTitle.trim()) { setFormError('Title is required.'); return }
    setSubmitting(true)
    setFormError('')
    const { error: err } = await createTicket({
      title:    newTitle.trim(),
      priority: newPriority,
      status:   'Open',
      user_id:  user?.id,
    })
    if (err) {
      setFormError(err.message)
    } else {
      setNewTitle('')
      setNewPriority('MEDIUM')
      setShowModal(false)
      await load()
    }
    setSubmitting(false)
  }

  const filtered = filter === 'All' ? tickets : tickets.filter(t => t.status === filter)

  return (
    <div className="flex-1 overflow-y-auto p-7">
      <div className="flex items-end justify-between mb-5">
        <div>
          <SectionLabel>// support</SectionLabel>
          <h2 className="font-syne font-bold text-[22px] tracking-tight">Support Tickets</h2>
        </div>
        <div className="flex items-center gap-2">
          {['All', 'Open', 'In Progress', 'Resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={filter === f
                ? { background: 'var(--az)', color: '#fff', border: '1px solid var(--az)' }
                : { border: '1px solid var(--br)', color: 'var(--mu)' }
              }
              className="px-3 py-1.5 rounded-md font-mono text-[11px] cursor-pointer transition-colors bg-transparent hover:border-az"
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-az hover:bg-az-dark text-white font-mono text-[12px] rounded-lg transition-colors border-0 cursor-pointer ml-2"
          >
            <i className="ti ti-plus" /> New Ticket
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
          className="mb-4 px-4 py-2.5 rounded-lg font-mono text-[11px] text-red-400 flex items-center gap-2">
          <i className="ti ti-alert-circle" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 font-mono text-[12px] text-mu">
          <i className="ti ti-loader-2 animate-spin mr-2" /> Loading tickets...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 font-mono text-[12px] text-mu">
          <i className="ti ti-ticket text-3xl mb-2" />
          {filter === 'All' ? 'No tickets yet — create your first one.' : `No ${filter.toLowerCase()} tickets.`}
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--br)' }}>
              {['ID', 'TITLE', 'PRIORITY', 'STATUS', 'UPDATED'].map(h => (
                <th key={h} className="font-mono text-[10px] text-mu tracking-wide py-2 px-3 text-left font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="hover:bg-[rgba(0,120,212,0.04)] transition-colors cursor-pointer">
                <td className="font-mono text-[11px] text-az-light py-2.5 px-3 whitespace-nowrap">
                  #{t.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="text-[12px] text-tx py-2.5 px-3">{t.title}</td>
                <td className="font-mono text-[11px] py-2.5 px-3" style={{ color: priorityColor[t.priority] ?? '#6B7280' }}>
                  {t.priority}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className="font-mono text-[10px] px-2 py-0.5 rounded"
                    style={{
                      background: statusStyle[t.status]?.bg ?? 'rgba(107,114,128,0.15)',
                      color:      statusStyle[t.status]?.text ?? '#6B7280',
                    }}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="font-mono text-[11px] text-mu py-2.5 px-3 whitespace-nowrap">
                  {fmtRelative(t.updated_at ?? t.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div
            style={{ background: 'var(--s2)', border: '1px solid var(--br)', width: '440px' }}
            className="rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-syne font-bold text-white text-[15px]">New Support Ticket</h3>
              <button onClick={() => setShowModal(false)} className="text-mu hover:text-tx transition-colors bg-transparent border-0 cursor-pointer">
                <i className="ti ti-x text-lg" />
              </button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                className="mb-3 px-3 py-2 rounded-lg font-mono text-[10px] text-red-400 flex items-center gap-2">
                <i className="ti ti-alert-circle" /> {formError}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block font-mono text-[10px] text-mu tracking-wide mb-1.5">TITLE</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Briefly describe the issue..."
                  style={{ background: 'var(--s)', border: '1px solid var(--br)' }}
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] text-tx font-mono outline-none focus:border-az transition-colors placeholder:text-mu/40"
                />
              </div>

              <div className="mb-5">
                <label className="block font-mono text-[10px] text-mu tracking-wide mb-1.5">PRIORITY</label>
                <div className="flex gap-2">
                  {['HIGH', 'MEDIUM', 'LOW'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      style={
                        newPriority === p
                          ? { background: `${priorityColor[p]}22`, border: `1px solid ${priorityColor[p]}`, color: priorityColor[p] }
                          : { border: '1px solid var(--br)', color: 'var(--mu)' }
                      }
                      className="flex-1 py-2 rounded-lg font-mono text-[11px] cursor-pointer transition-colors bg-transparent"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ border: '1px solid var(--br)' }}
                  className="flex-1 py-2.5 rounded-lg font-mono text-[12px] text-mu hover:border-az hover:text-az-light transition-colors bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-az hover:bg-az-dark text-white font-mono text-[12px] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-plus" />}
                  {submitting ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
