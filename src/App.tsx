import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Studio from '@/pages/Studio'
import Settings from '@/pages/Settings'
import Auth from '@/pages/Auth'
import Membership from '@/pages/Membership'
import Credits from '@/pages/Credits'
import Invite from '@/pages/Invite'
import ToastContainer from '@/components/ui/Toast'
import { useAuthStore } from '@/store/useAuthStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchMe } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && !useAuthStore.getState().user) {
      fetchMe()
    }
  }, [isAuthenticated, fetchMe])

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/membership" element={<ProtectedRoute><Membership /></ProtectedRoute>} />
        <Route path="/credits" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
        <Route path="/invite" element={<ProtectedRoute><Invite /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}
