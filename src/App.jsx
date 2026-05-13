import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { signOut }               from '@/lib/supabase'
import LandingPage               from '@/pages/LandingPage'
import DashboardPage             from '@/pages/DashboardPage'

function AppRouter() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--s)' }}>
        <div className="font-mono text-mu text-sm flex items-center gap-2">
          <i className="ti ti-loader-2 animate-spin text-az text-lg" />
          Authenticating...
        </div>
      </div>
    )
  }

  if (user) {
    return <DashboardPage user={user.email} onLogout={signOut} />
  }

  return <LandingPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
