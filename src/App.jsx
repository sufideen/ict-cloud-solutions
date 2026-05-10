import { useState } from 'react'
import { AuthProvider } from '@/lib/AuthContext'
import LandingPage   from '@/pages/LandingPage'
import DashboardPage from '@/pages/DashboardPage'

export default function App() {
  const [user, setUser] = useState(null)

  const handleLogin  = (email) => setUser(email)
  const handleLogout = ()      => setUser(null)

  return (
    <AuthProvider>
      {user
        ? <DashboardPage user={user} onLogout={handleLogout} />
        : <LandingPage   onLogin={handleLogin} />
      }
    </AuthProvider>
  )
}
