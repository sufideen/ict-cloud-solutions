import { useState, useRef } from 'react'
import { signInWithEmail, signInWithGoogle, signInWithAzureAD, resetPassword } from '@/lib/supabase'
import { Button } from '@/components/ui'

export default function LoginForm() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [mfa,      setMfa]      = useState(['', '', '', '', '', ''])
  const [error,    setError]    = useState('')
  const [notice,   setNotice]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const mfaRefs = useRef([])

  const handleMfaChange = (val, i) => {
    const next = [...mfa]
    next[i] = val.slice(-1)
    setMfa(next)
    if (val && i < 5) mfaRefs.current[i + 1]?.focus()
  }
  const handleMfaKey = (e, i) => {
    if (e.key === 'Backspace' && !mfa[i] && i > 0) mfaRefs.current[i - 1]?.focus()
  }

  const handleLogin = async (e) => {
    e?.preventDefault()
    setError('')
    setNotice('')
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const { error: authError } = await signInWithEmail(email, password)
      if (authError) setError(authError.message)
      // On success AuthContext picks up the session change — no manual redirect needed
    } catch {
      setError('Unable to connect. Check your network and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setNotice('')
    await signInWithGoogle()
  }

  const handleAzureAD = async () => {
    setError('')
    setNotice('')
    await signInWithAzureAD()
  }

  const handleResetPassword = async () => {
    setError('')
    setNotice('')
    if (!email.trim()) {
      setError('Enter your work email above, then click Forgot password.')
      return
    }
    setLoading(true)
    const { error: resetErr } = await resetPassword(email)
    if (resetErr) setError(resetErr.message)
    else setNotice(`Password reset email sent to ${email}. Check your inbox.`)
    setLoading(false)
  }

  return (
    <section id="login" className="px-12 py-20" style={{ background: 'var(--s2)', borderTop: '1px solid var(--br)', borderBottom: '1px solid var(--br)' }}>
      <div className="grid grid-cols-2 gap-16 items-center">

        {/* Left — info */}
        <div>
          <p className="font-mono text-[10px] tracking-[2px] text-az uppercase mb-2.5">{'// client portal'}</p>
          <h2 className="font-syne font-bold text-[28px] tracking-tight leading-tight mb-3">
            Secure access.<br />Verified clients only.
          </h2>
          <p className="text-mu text-[13px] leading-loose mb-5">
            The ict-cloud.solutions portal is restricted to verified enterprise clients. Access is granted
            following onboarding. All sessions run through Cloudflare Zero Trust, backed by Supabase Auth
            with MFA enforced.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Invite-only access',
              'Cloudflare Zero Trust',
              'Supabase Auth + RLS',
              'MFA enforced',
              'End-to-end encrypted',
              'ISO 27001 aligned',
            ].map(b => (
              <span
                key={b}
                style={{ border: '1px solid var(--br)' }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono text-mu"
              >
                <i className="ti ti-check text-az-light text-xs" /> {b}
              </span>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div style={{ background: 'var(--s3)', border: '1px solid var(--br)' }} className="rounded-xl p-7">

          {/* Header */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} className="flex items-center gap-2.5 mb-6 pb-4">
            <div style={{ background: 'rgba(0,120,212,0.1)', border: '1px solid rgba(0,120,212,0.2)' }} className="w-8 h-8 rounded-lg flex items-center justify-center text-az-light">
              <i className="ti ti-lock text-sm" />
            </div>
            <div>
              <p className="font-syne font-semibold text-[14px]">Client Portal — ict-cloud.solutions</p>
              <p className="font-mono text-[11px] text-mu">{'// secure · invite-only · cloudflare + supabase'}</p>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)' }} className="flex items-center gap-2 mb-3 px-3 py-2 rounded-md text-[11px] font-mono text-red-300">
              <i className="ti ti-alert-circle" /> {error}
            </div>
          )}
          {notice && (
            <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)' }} className="flex items-center gap-2 mb-3 px-3 py-2 rounded-md text-[11px] font-mono text-green-300">
              <i className="ti ti-circle-check" /> {notice}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="mb-3.5">
              <label className="block font-mono text-[10px] text-mu tracking-wide mb-1.5">WORK EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@organisation.com"
                style={{ background: 'var(--s)', border: '1px solid var(--br)' }}
                className="w-full px-3 py-2.5 rounded-lg text-[13px] text-tx outline-none focus:border-az transition-colors placeholder:text-mu/40"
              />
            </div>

            {/* Password */}
            <div className="mb-3.5">
              <label className="block font-mono text-[10px] text-mu tracking-wide mb-1.5">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{ background: 'var(--s)', border: '1px solid var(--br)' }}
                className="w-full px-3 py-2.5 rounded-lg text-[13px] text-tx outline-none focus:border-az transition-colors placeholder:text-mu/40"
              />
            </div>

            {/* MFA */}
            <div className="mb-3.5">
              <label className="block font-mono text-[10px] text-mu tracking-wide mb-1.5">AUTHENTICATOR CODE (MFA)</label>
              <div className="flex gap-2">
                {mfa.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => mfaRefs.current[i] = el}
                    type="text"
                    maxLength={1}
                    value={digit}
                    placeholder="·"
                    onChange={e => handleMfaChange(e.target.value, i)}
                    onKeyDown={e => handleMfaKey(e, i)}
                    style={{ background: 'var(--s)', border: '1px solid var(--br)' }}
                    className="flex-1 py-2.5 rounded-lg text-[15px] font-mono text-tx text-center outline-none focus:border-az-light transition-colors placeholder:text-mu/40"
                  />
                ))}
              </div>
            </div>

            {/* SSO */}
            <div className="flex gap-2 mb-3.5">
              {[
                { icon: 'ti-brand-google',  label: 'Google SSO',  action: handleGoogle },
                { icon: 'ti-brand-windows', label: 'Azure AD SSO', action: handleAzureAD },
              ].map(btn => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={btn.action}
                  style={{ border: '1px solid var(--br)' }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-mono text-mu hover:border-az hover:text-az-light transition-colors bg-transparent cursor-pointer"
                >
                  <i className={`ti ${btn.icon}`} /> {btn.label}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-az hover:bg-az-dark text-white font-mono text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? <i className="ti ti-loader animate-spin" /> : <i className="ti ti-arrow-right" />}
              {loading ? 'Signing in...' : 'Sign in to Portal'}
            </button>
          </form>

          {/* CF notice */}
          <div style={{ background: 'rgba(246,130,31,0.06)', border: '1px solid rgba(246,130,31,0.2)' }} className="flex items-center gap-2 mt-3 px-3 py-2 rounded-md text-[10px] font-mono text-[#F6821F]">
            <i className="ti ti-shield-check" /> Protected by Cloudflare Zero Trust · Sessions audited via Supabase
          </div>

          <p className="text-center text-[10px] font-mono text-mu mt-3">
            <a href="mailto:access@ict-cloud.solutions" className="text-az-light hover:underline cursor-pointer">Request access</a>
            {' · '}
            <span onClick={handleResetPassword} className="text-az-light cursor-pointer hover:underline">Forgot password</span>
          </p>
        </div>
      </div>
    </section>
  )
}
