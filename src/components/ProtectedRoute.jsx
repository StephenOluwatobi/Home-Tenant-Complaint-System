import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export default function ProtectedRoute({ role }) {
  const { session, checkingSession } = useAuth()
  if (checkingSession) return null
  if (!session || session.role !== role) {
    return <Navigate to={role === 'management' ? '/management/login' : '/'} replace />
  }
  return <Outlet />
}
