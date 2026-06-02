import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Studio from '@/pages/Studio'
import Settings from '@/pages/Settings'
import ToastContainer from '@/components/ui/Toast'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Studio />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}
