import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname ?? '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-cream)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 p-10 flex-shrink-0"
        style={{ background: 'linear-gradient(160deg, var(--color-dark) 0%, var(--color-dark-mid) 100%)' }}>
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold font-display border-2"
            style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))', borderColor: 'var(--color-gold)' }}>
            PFB
          </div>
          <span className="font-display text-white text-lg">Perfect Finger Braids</span>
        </Link>
        <div>
          <p className="font-display text-3xl text-white font-medium mb-4 leading-snug">
            "Every braid is a work of art. Come wear yours."
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Log in to manage your appointments and profile.
          </p>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} Perfect Finger Braids</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold font-display"
              style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
              PFB
            </div>
            <span className="font-display text-base">Perfect Finger Braids</span>
          </Link>

          <h1 className="font-display text-3xl font-medium mb-2">Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--color-pink)' }}>
              Create one
            </Link>
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Email address</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-pink"
                style={{ borderColor: 'rgba(224,48,112,0.2)', background: 'white', fontFamily: 'var(--font-body)' }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-pink pr-12"
                  style={{ borderColor: 'rgba(224,48,112,0.2)', background: 'white', fontFamily: 'var(--font-body)' }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded"
                  style={{ color: 'var(--color-muted)' }}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-full text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
              style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--color-muted)' }}>
            By logging in you agree to our terms and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}