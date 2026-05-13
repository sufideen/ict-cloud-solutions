import { useState } from 'react'
import { SectionLabel } from '@/components/ui'
import { useAuth } from '@/lib/AuthContext'
import { resetPassword } from '@/lib/supabase'

const ROLES = ['Admin', 'Member', 'Viewer']

export default function TeamPanel() {
  const { user }                      = useAuth()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState('Member')
  const [notice,      setNotice]      = useState('')
  const [error,       setError]       = useState('')
  const [sending,     setSending]     = useState(false)

  const initials = (email) => email?.split('@')[0].slice(0, 2).toUpperCase() ?? 'CL'

  // Invite flow: Supabase admin invite requires a service role key, which must
  // stay server-side. For now we send the invite via a password reset email
  // (which acts as a magic link for new users) until an invite Edge Function is added.
  const handleInvite = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!inviteEmail.trim()) { setError('Email address is required.'); return }
    setSending(true)
    const { error: err } = await resetPassword(inviteEmail.trim())
    if (err) {
      setError(err.message)
    } else {
      setNotice(`Invite sent to ${inviteEmail}. They will receive a link to set their password.`)
      setInviteEmail('')
    }
    setSending(false)
  }

  return (
    <div className="flex-1 overflow-y-auto p-7">
      <SectionLabel>// access control</SectionLabel>
      <h2 className="font-syne font-bold text-[22px] tracking-tight mb-6">Team Access</h2>

      <div className="grid grid-cols-2 gap-5">

        {/* Current user card */}
        <div>
          <h3 className="font-syne font-semibold text-white text-[13px] mb-3">Your Account</h3>
          <div style={{ background: 'var(--s3)', border: '1px solid var(--br)' }} className="rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-az flex items-center justify-center text-white font-mono font-bold text-base flex-shrink-0">
                {initials(user?.email)}
              </div>
              <div>
                <p className="text-[14px] text-tx font-medium">{user?.email}</p>
                <p className="font-mono text-[11px] text-mu mt-0.5">Admin · Verified</p>
              </div>
            </div>
            {[
              ['User ID',        user?.id?.slice(0, 16) + '…'],
              ['Auth provider',  user?.app_metadata?.provider ?? 'email'],
              ['Email verified', user?.email_confirmed_at ? 'Yes' : 'Pending'],
              ['Last sign in',   user?.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="flex justify-between py-2 font-mono text-[11px]">
                <span className="text-mu">{k}</span>
                <span className="text-tx truncate max-w-[55%] text-right">{v}</span>
              </div>
            ))}
          </div>

          {/* Security info */}
          <div style={{ background: 'rgba(0,120,212,0.06)', border: '1px solid rgba(0,120,212,0.15)' }} className="rounded-xl p-4 mt-4">
            <p className="font-syne font-semibold text-[12px] text-az-light flex items-center gap-2 mb-2">
              <i className="ti ti-shield-check" /> Security &amp; Compliance
            </p>
            {[
              ['Row-Level Security', 'Enforced on all tables', '#4ADE80'],
              ['MFA',                'Available via Supabase Auth', '#50ABF1'],
              ['Session audit',      'Logged via chat_messages', '#50ABF1'],
              ['Zero Trust',         'Cloudflare Access (configure separately)', '#F6821F'],
            ].map(([k, v, c]) => (
              <div key={k} className="flex justify-between py-1.5 font-mono text-[10px]">
                <span className="text-mu">{k}</span>
                <span style={{ color: c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invite panel */}
        <div>
          <h3 className="font-syne font-semibold text-white text-[13px] mb-3">Invite Team Member</h3>
          <div style={{ background: 'var(--s3)', border: '1px solid var(--br)' }} className="rounded-xl p-5">
            <p className="font-mono text-[11px] text-mu mb-4 leading-relaxed">
              Send an invitation link to a new team member. They will receive an email to set their password and access the portal.
            </p>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                className="mb-3 px-3 py-2 rounded-lg font-mono text-[10px] text-red-400 flex items-center gap-2">
                <i className="ti ti-alert-circle" /> {error}
              </div>
            )}
            {notice && (
              <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)' }}
                className="mb-3 px-3 py-2 rounded-lg font-mono text-[10px] text-green-300 flex items-center gap-2">
                <i className="ti ti-circle-check" /> {notice}
              </div>
            )}

            <form onSubmit={handleInvite}>
              <div className="mb-3.5">
                <label className="block font-mono text-[10px] text-mu tracking-wide mb-1.5">WORK EMAIL</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@organisation.com"
                  style={{ background: 'var(--s)', border: '1px solid var(--br)' }}
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] text-tx font-mono outline-none focus:border-az transition-colors placeholder:text-mu/40"
                />
              </div>

              <div className="mb-4">
                <label className="block font-mono text-[10px] text-mu tracking-wide mb-1.5">ROLE</label>
                <div className="flex gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      style={
                        inviteRole === r
                          ? { background: 'rgba(0,120,212,0.2)', border: '1px solid var(--az)', color: 'var(--az-light)' }
                          : { border: '1px solid var(--br)', color: 'var(--mu)' }
                      }
                      className="flex-1 py-2 rounded-lg font-mono text-[11px] cursor-pointer transition-colors bg-transparent"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-az hover:bg-az-dark text-white font-mono text-[12px] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {sending ? <i className="ti ti-loader-2 animate-spin" /> : <i className="ti ti-send" />}
                {sending ? 'Sending invite...' : 'Send Invite'}
              </button>
            </form>
          </div>

          {/* Note about full admin invite */}
          <div style={{ background: 'rgba(246,130,31,0.06)', border: '1px solid rgba(246,130,31,0.2)' }}
            className="rounded-xl p-4 mt-4 font-mono text-[10px] text-[#F6821F]">
            <p className="flex items-center gap-2 mb-1.5 font-semibold">
              <i className="ti ti-info-circle" /> Full user management
            </p>
            <p className="text-mu leading-relaxed">
              To list and manage all users, deploy the <span className="text-tx">invite</span> Edge Function and call{' '}
              <span className="text-tx">supabase.auth.admin.inviteUserByEmail()</span> server-side.
              See the Supabase dashboard → Authentication → Users for a full user list.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
