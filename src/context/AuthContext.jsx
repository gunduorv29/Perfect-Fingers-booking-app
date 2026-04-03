import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Skip INITIAL_SESSION — already handled by initializeAuth above
        if (_event === 'INITIAL_SESSION') return

        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId, retryCount = 0) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        // Retry once on network/RLS error
        if (retryCount === 0 && (error.message.includes('network') || error.message.includes('RLS'))) {
          console.warn('Profile fetch failed, retrying:', error.message)
          return fetchProfile(userId, 1)
        }
        console.error('fetchProfile error:', error)
        return
      }
      
      if (data) {
        setProfile(data)
      } else {
        // No profile yet - create minimal
        const { error: createError } = await supabase
          .from('profiles')
          .insert({ id: userId, full_name: userId.split('@')[0], role: 'client' })
        if (!createError) {
          // Refetch after create
          return fetchProfile(userId, retryCount + 1)
        }
      }
    } catch (err) {
      console.error('fetchProfile error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    refetchProfile: () => user && fetchProfile(user.id),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)