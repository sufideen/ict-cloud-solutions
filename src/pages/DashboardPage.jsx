import { useState } from 'react'
import Sidebar        from '@/components/dashboard/Sidebar'
import Overview       from '@/components/dashboard/Overview'
import ChatPanel      from '@/components/chat/ChatPanel'
import RagPanel       from '@/components/rag/RagPanel'
import TicketsPanel   from '@/components/tickets/TicketsPanel'
import SettingsPanel  from '@/components/settings/SettingsPanel'
import ReportsPanel   from '@/components/reports/ReportsPanel'
import TeamPanel      from '@/components/team/TeamPanel'
import { PulseDot }   from '@/components/ui'

const PANEL_TITLES = {
  overview: 'Overview',
  chat:     'AI Assistant',
  rag:      'Knowledge Base (RAG)',
  tickets:  'Support Tickets',
  settings: 'Settings',
  reports:  'Reports',
  team:     'Team Access',
}

export default function DashboardPage({ user, onLogout }) {
  const [activePanel, setActivePanel] = useState('overview')

  const renderPanel = () => {
    switch (activePanel) {
      case 'overview': return <Overview onNav={setActivePanel} />
      case 'chat':     return <ChatPanel user={user} />
      case 'rag':      return <RagPanel />
      case 'tickets':  return <TicketsPanel />
      case 'settings': return <SettingsPanel />
      case 'reports':  return <ReportsPanel />
      case 'team':     return <TeamPanel />
      default:         return null
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--s)' }}>
      <Sidebar
        active={activePanel}
        onNav={setActivePanel}
        user={user}
        onLogout={onLogout}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <div
          style={{ background: 'var(--s2)', borderBottom: '1px solid var(--br)' }}
          className="flex items-center justify-between px-7 h-14 flex-shrink-0"
        >
          <span className="font-syne font-bold text-white text-base">
            {PANEL_TITLES[activePanel] ?? activePanel}
          </span>

          <div className="flex items-center gap-3">
            {[
              { dot: '#4ADE80', label: 'Supabase · Connected' },
              { dot: '#F6821F', label: 'Cloudflare · Active',  icon: 'ti-shield-check', iconColor: '#F6821F' },
              { dot: '#50ABF1', label: 'OpenAI · Online',      icon: 'ti-sparkles',     iconColor: '#50ABF1' },
            ].map(b => (
              <span
                key={b.label}
                style={{ border: '1px solid var(--br)' }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono text-mu"
              >
                {b.icon
                  ? <i className={`ti ${b.icon} text-xs`} style={{ color: b.iconColor }} />
                  : <PulseDot color={b.dot} />
                }
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Panel content */}
        <div className="flex flex-1 overflow-hidden">
          {renderPanel()}
        </div>
      </div>
    </div>
  )
}
