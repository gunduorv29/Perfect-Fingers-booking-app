import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import toast from 'react-hot-toast'

export default function Signup() {
  const navigate = useNavigate()

  const [fullName,  setFullName]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    if (!fullName || !email || !password) return toast.error('Please fill in all required fields')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone } },
      })
      if (error) throw error
      // Profile is auto-created by the DB trigger
      // Update phone separately if provided
      if (phone) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('profiles').update({ phone }).eq('id', user.id)
        }
      }
      toast.success('Account created! Welcome to Perfect Finger Braids.')
      navigate('/services')
    } catch (err) {
      toast.error(err.message ?? 'Signup failed. Please try again.')
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
            "Your crown deserves nothing but the best."
          </p>
          <ul className="flex flex-col gap-2.5">
            {['Easy online booking 24/7', 'Your appointments in one place', 'Manage & cancel anytime'].map(item => (
              <li key={item} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white"
                  style={{ background: 'var(--color-pink)' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
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

          <h1 className="font-display text-3xl font-medium mb-2">Create your account</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
            Already have one?{' '}
            <Link to="/login" className="font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--color-pink)' }}>
              Log in
            </Link>
          </p>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>
                  Full name <span style={{ color: 'var(--color-pink)' }}>*</span>
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-pink"
                  style={{ borderColor: 'rgba(224,48,112,0.2)', background: 'white', fontFamily: 'var(--font-body)' }}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>Phone number</label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:border-pink"
                  style={{ borderColor: 'rgba(224,48,112,0.2)', background: 'white', fontFamily: 'var(--font-body)' }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>
                Email address <span style={{ color: 'var(--color-pink)' }}>*</span>
              </label>
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
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>
                Password <span style={{ color: 'var(--color-pink)' }}>*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--color-muted)' }}>
            By signing up you agree to our terms and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}