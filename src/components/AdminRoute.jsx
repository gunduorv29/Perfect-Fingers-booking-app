import { useAuth } from '../context/AuthContext'
import { Navigate, Outlet } from 'react-router-dom'

export default function AdminRoute() {
  const { user, profile, loading, refetchProfile } = useAuth()
  
  // Extended loading: auth + profile resolved
  if (loading || profile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-cream)' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{
              borderColor: 'var(--color-pink-pale)',
              borderTopColor: 'var(--color-pink)',
            }}
          />
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading admin...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Temp admin recovery: email check if profile missing/corrupted
  const isAdminRecovery = !profile && user.email?.includes('admin')
  const isAdmin = profile?.role === 'admin' || isAdminRecovery

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  // Auto-refetch if recovery mode (profile issue)
  if (isAdminRecovery) {
    refetchProfile()
  }

  return <Outlet />
}
