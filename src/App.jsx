import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Navbar from './components/Navbar'

import Landing from './pages/Landing'
import Services from './pages/Services'
import Book from './pages/Book'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Dashboard from './pages/dashboard/Dashboard'
import AdminDashboard from './pages/admin/AdminDashboard'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"         element={<Landing />} />
          <Route path="/services" element={<Services />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/signup"   element={<Signup />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/book"      element={<Book />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'var(--font-body)', fontSize: '14px' },
            success: { iconTheme: { primary: 'var(--color-pink)', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}