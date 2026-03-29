import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin   = profile?.role === 'admin'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/')
    setMobileOpen(false)
  }

  const navLink = (href, label) => (
    <Link
      to={href}
      onClick={() => setMobileOpen(false)}
      className="text-sm font-medium transition-colors hover:text-pink"
      style={{
        color: location.pathname === href ? 'var(--color-pink)' : 'var(--color-muted)',
      }}
    >
      {label}
    </Link>
  )

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{ background: 'rgba(255,248,243,0.92)', backdropFilter: 'blur(16px)', borderColor: 'rgba(224,48,112,0.08)' }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold font-display border-2"
            style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))', borderColor: 'var(--color-gold)' }}>
            PFB
          </div>
          <span className="font-display text-lg font-medium hidden sm:block" style={{ color: 'var(--color-dark)' }}>
            Perfect Finger Braids
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLink('/', 'Home')}
          {navLink('/services', 'Services')}
          {user && !isAdmin && navLink('/dashboard', 'My Bookings')}
          {isAdmin && navLink('/admin', 'Dashboard')}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Hi, {firstName}</span>
              <button onClick={handleSignOut}
                className="text-sm px-4 py-2 rounded-full border font-medium hover:opacity-80"
                style={{ borderColor: 'rgba(224,48,112,0.25)', color: 'var(--color-pink)' }}>
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login"
                className="text-sm font-medium hover:text-pink transition-colors"
                style={{ color: 'var(--color-muted)' }}>
                Log In
              </Link>
              <Link to="/signup"
                className="text-sm font-medium px-5 py-2.5 rounded-full text-white hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
                Book Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          <span className={`block w-6 h-0.5 transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`}
            style={{ background: 'var(--color-dark)' }} />
          <span className={`block w-6 h-0.5 transition-all ${mobileOpen ? 'opacity-0' : ''}`}
            style={{ background: 'var(--color-dark)' }} />
          <span className={`block w-6 h-0.5 transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`}
            style={{ background: 'var(--color-dark)' }} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t px-6 py-4 flex flex-col gap-4"
          style={{ background: 'var(--color-cream)', borderColor: 'rgba(224,48,112,0.08)' }}>
          {navLink('/', 'Home')}
          {navLink('/services', 'Services')}
          {user && !isAdmin && navLink('/dashboard', 'My Bookings')}
          {isAdmin && navLink('/admin', 'Admin Dashboard')}
          <div className="pt-2 border-t flex flex-col gap-3" style={{ borderColor: 'rgba(224,48,112,0.08)' }}>
            {user ? (
              <button onClick={handleSignOut}
                className="text-sm font-medium px-4 py-2.5 rounded-full text-left"
                style={{ color: 'var(--color-pink)', background: 'var(--color-pink-blush)' }}>
                Sign Out
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                  Log In
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium px-5 py-2.5 rounded-full text-white text-center"
                  style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
                  Book Now
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}