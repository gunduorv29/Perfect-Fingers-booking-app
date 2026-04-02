import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

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
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/admin', 'Admin')}
        </div>

        {/* Auth buttons - simplified */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login"
            className="text-sm font-medium hover:text-pink transition-colors"
            style={{ color: 'var(--color-muted)' }}>
            Log In
          </Link>
          <Link to="/book"
            className="text-sm font-medium px-5 py-2.5 rounded-full text-white hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
            Book Now
          </Link>
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
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/admin', 'Admin')}
          <div className="pt-2 border-t flex flex-col gap-3" style={{ borderColor: 'rgba(224,48,112,0.08)' }}>
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
              Log In
            </Link>
            <Link to="/book" onClick={() => setMobileOpen(false)}
              className="text-sm font-medium px-5 py-2.5 rounded-full text-white text-center"
              style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
              Book Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
