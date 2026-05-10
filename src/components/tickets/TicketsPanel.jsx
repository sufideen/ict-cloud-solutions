import { useState } from 'react'
import { SectionLabel } from '@/components/ui'

const TICKETS = [
  { id: '#TK-0041', title: 'AKS node pool scaling issue — prod',  priority: 'HIGH',   status: 'In Progress', assignee: 'Alex M.',   updated: '2h ago' },
  { id: '#TK-0040', title: 'Azure OpenAI quota increase request', priority: 'MEDIUM', status: 'Open',        assignee: 'Unassigned',updated: '1d ago' },
  { id: '#TK-0039', title: 'Entra ID SSO group mapping update',   priority: 'MEDIUM', status: 'Open',        assignee: 'Sarah K.',  updated: '2d ago' },
  { id: '#TK-0038', title: 'Cloudflare WAF rule review',          priority: 'LOW',    status: 'Resolved',    assignee: 'James T.',  updated: '3d ago' },
  { id: '#TK-0037', title: 'Supabase RLS policy audit',           priority: 'LOW',    status: 'Resolved',    assignee: 'Sarah K.',  updated: '5d ago' },
  { id: '#TK-0036', title: 'Terraform state locking config',      priority: 'HIGH',   status: 'Resolved',    assignee: 'Alex M.',   updated: '1w ago' },
]

const priorityColor = { HIGH: '#F87171', MEDIUM: '#EAB308', LOW: '#4ADE80' }
const statusStyle   = {
  'Open':        { bg: 'rgba(0,120,212,0.15)',  text: '#50ABF1' },
  'In Progress': { bg: 'rgba(234,179,8,0.15)',  text: '#EAB308' },
  'Resolved':    { bg: 'rgba(22,163,74,0.15)',  text: '#4ADE80' },
}

export default function TicketsPanel() {
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All'
    ? TICKETS
    : TICKETS.filter(t => t.status === filter)

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
          <button className="flex items-center gap-1.5 px-4 py-1.5 bg-az hover:bg-az-dark text-white font-mono text-[12px] rounded-lg transition-colors border-0 cursor-pointer ml-2">
            <i className="ti ti-plus" /> New Ticket
          </button>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--br)' }}>
            {['ID', 'TITLE', 'PRIORITY', 'STATUS', 'ASSIGNEE', 'UPDATED'].map(h => (
              <th key={h} className="font-mono text-[10px] text-mu tracking-wide py-2 px-3 text-left font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(t => (
            <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="hover:bg-[rgba(0,120,212,0.04)] transition-colors cursor-pointer">
              <td className="font-mono text-[12px] text-az-light py-2.5 px-3">{t.id}</td>
              <td className="text-[12px] text-tx py-2.5 px-3">{t.title}</td>
              <td className="font-mono text-[11px] py-2.5 px-3" style={{ color: priorityColor[t.priority] }}>{t.priority}</td>
              <td className="py-2.5 px-3">
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded"
                  style={{ background: statusStyle[t.status].bg, color: statusStyle[t.status].text }}
                >
                  {t.status}
                </span>
              </td>
              <td className="text-[12px] text-mu py-2.5 px-3">{t.assignee}</td>
              <td className="font-mono text-[11px] text-mu py-2.5 px-3">{t.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
