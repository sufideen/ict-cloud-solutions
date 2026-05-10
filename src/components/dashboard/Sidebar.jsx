import { signOut } from '@/lib/supabase'

const NAV = [
  { id: 'overview',  icon: 'ti-layout-dashboard', label: 'Overview',            section: 'WORKSPACE' },
  { id: 'chat',      icon: 'ti-message-chatbot',   label: 'AI Assistant',        section: null },
  { id: 'rag',       icon: 'ti-books',             label: 'Knowledge Base (RAG)', section: null },
  { id: 'tickets',   icon: 'ti-ticket',            label: 'Support Tickets',     section: null },
  { id: 'settings',  icon: 'ti-settings',          label: 'Settings',            section: 'MANAGEMENT' },
  { id: 'reports',   icon: 'ti-file-analytics',    label: 'Reports',             section: null },
  { id: 'team',      icon: 'ti-users',             label: 'Team Access',         section: null },
]

export default function Sidebar({ active, onNav, user, onLogout }) {
  const initials = (user || '').split('@')[0].slice(0, 2).toUpperCase() || 'CL'

  const handleLogout = async () => {
    await signOut()
    onLogout()
  }

  return (
    <aside
      style={{ width: '220px', minWidth: '220px', background: 'var(--s2)', borderRight: '1px solid var(--br)' }}
      className="flex flex-col h-screen sticky top-0"
    >
      {/* Logo */}
      <div style={{ borderBottom: '1px solid var(--br)' }} className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-7 h-7 bg-az rounded-md flex items-center justify-center font-mono font-bold text-white text-xs">ICT</div>
        <span className="font-syne font-bold text-white text-[14px]">ict-cloud</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map(item => (
          <div key={item.id}>
            {item.section && (
              <p className="font-mono text-[9px] tracking-[1.5px] text-mu mt-4 mb-1.5 ml-2">{item.section}</p>
            )}
            <button
              onClick={() => onNav(item.id)}
              style={active === item.id ? { borderLeft: '2px solid var(--az)', background: 'rgba(0,120,212,0.15)' } : {}}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg font-mono text-[12px] border-0 cursor-pointer transition-all text-left
                ${active === item.id ? 'text-az-light' : 'text-mu hover:bg-[rgba(0,120,212,0.1)] hover:text-az-light'}`}
            >
              <i className={`ti ${item.icon} text-base`} />
              {item.label}
            </button>
          </div>
        ))}
      </nav>

      {/* User */}
      <div style={{ borderTop: '1px solid var(--br)' }} className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-az flex items-center justify-center text-white font-mono font-bold text-[11px] flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-tx font-medium truncate">{user}</p>
            <p className="font-mono text-[10px] text-mu">Enterprise · Verified</p>
          </div>
          <button onClick={handleLogout} className="text-mu hover:text-red-400 transition-colors bg-transparent border-0 cursor-pointer" title="Sign out">
            <i className="ti ti-logout text-sm" />
          </button>
        </div>
      </div>
    </aside>
  )
}
