import { useAuth } from '../context/AuthContext'
import { Navigate, Outlet } from 'react-router-dom'

export default function AdminRoute() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-cream)' }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'var(--color-pink-pale)',
            borderTopColor: 'var(--color-pink)',
          }}
        />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  // Renders the matched child route
  return <Outlet />
}