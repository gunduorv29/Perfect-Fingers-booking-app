import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}
