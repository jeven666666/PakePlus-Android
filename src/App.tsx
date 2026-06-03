import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'

const Studio = lazy(() => import('@/pages/Studio'))
const Settings = lazy(() => import('@/pages/Settings'))
const Membership = lazy(() => import('@/pages/Membership'))
const Credits = lazy(() => import('@/pages/Credits'))
const Invite = lazy(() => import('@/pages/Invite'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Auth = lazy(() => import('@/pages/Auth'))
const StorageUpgrade = lazy(() => import('@/pages/StorageUpgrade'))

import ErrorBoundary from '@/components/ErrorBoundary'
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
      <ErrorBoundary>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-agnes-bg"><div className="w-8 h-8 border-2 border-agnes-purple border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/membership" element={<ProtectedRoute><Membership /></ProtectedRoute>} />
            <Route path="/credits" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
            <Route path="/invite" element={<ProtectedRoute><Invite /></ProtectedRoute>} />
            <Route path="/storage-upgrade" element={<ProtectedRoute><StorageUpgrade /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <ToastContainer />
      </ErrorBoundary>
    </BrowserRouter>
  )
}
