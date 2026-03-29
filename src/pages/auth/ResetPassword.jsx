import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const navigate = useNavigate()

  const [password,     setPassword]     = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [checking,     setChecking]     = useState(true)

  useEffect(() => {
    // Supabase embeds the token in the URL hash as:
    // #access_token=...&type=recovery
    // We parse it directly so we don't miss the event if it fired early.
    const hash   = window.location.hash
    const params = new URLSearchParams(hash.replace('#', ''))
    const type   = params.get('type')
    const token  = params.get('access_token')

    if (type === 'recovery' && token) {
      // Manually set the session from the hash tokens so updateUser() works
      supabase.auth.setSession({
        access_token:  token,
        refresh_token: params.get('refresh_token') ?? '',
      }).then(({ error }) => {
        if (error) {
          setValidSession(false)
        } else {
          setValidSession(true)
        }
        setChecking(false)
      })
      return
    }

    // Fallback: listen for the PASSWORD_RECOVERY event (fires if the client
    // detected the hash before this component mounted)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true)
        setChecking(false)
      }
    })

    // If neither fires within 3s, assume the link is invalid/expired
    const timeout = setTimeout(() => setChecking(false), 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleReset(e) {
    e.preventDefault()
    if (!password || !confirm) return toast.error('Please fill in both fields.')
    if (password.length < 6)   return toast.error('Password must be at least 6 characters.')
    if (password !== confirm)  return toast.error('Passwords do not match.')

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password updated! Please log in.')
      await supabase.auth.signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.message ?? 'Could not update password. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-cream)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 p-10 shrink-0"
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
            Set a new password for your account.
          </p>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()} Perfect Finger Braids
        </p>
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

          {/* Checking */}
          {checking && (
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-4"
                style={{ borderColor: 'var(--color-pink-blush)', borderTopColor: 'var(--color-pink)' }} />
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Verifying reset link…</p>
            </div>
          )}

          {/* Invalid / expired */}
          {!checking && !validSession && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-5"
                style={{ background: 'rgba(224,48,112,0.08)' }}>
                🔗
              </div>
              <h1 className="font-display text-3xl font-medium mb-3">Link expired</h1>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-muted)' }}>
                This reset link is invalid or has expired. Please request a new one from the login page.
              </p>
              <Link to="/login"
                className="inline-block w-full py-3.5 rounded-full text-sm font-medium text-white text-center hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
                Back to Login
              </Link>
            </div>
          )}

          {/* Valid — show form */}
          {!checking && validSession && (
            <>
              <h1 className="font-display text-3xl font-medium mb-2">New password</h1>
              <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors pr-12"
                      style={{ borderColor: 'rgba(224,48,112,0.2)', background: 'white', fontFamily: 'var(--font-body)' }}
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded"
                      style={{ color: 'var(--color-muted)' }}>
                      {showPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-muted)' }}>
                    Confirm new password
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
                    style={{ borderColor: 'rgba(224,48,112,0.2)', background: 'white', fontFamily: 'var(--font-body)' }}
                  />
                </div>

                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all"
                        style={{
                          background: password.length >= i * 3
                            ? i <= 1 ? '#ef4444'
                            : i <= 2 ? '#f97316'
                            : i <= 3 ? '#eab308'
                            : '#22c55e'
                            : 'rgba(224,48,112,0.1)'
                        }} />
                    ))}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-full text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
                  style={{ background: 'linear-gradient(135deg, var(--color-pink), var(--color-pink-deep))' }}>
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}