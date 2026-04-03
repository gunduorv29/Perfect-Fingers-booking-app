import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`
🚨 Supabase config missing! Add to .env.local:
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

App will run but DB calls will fail.
  `.trim())
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper to safely call with client check
export function safeSupabase(fn, ...args) {
  if (!supabase) {
    console.warn('Supabase client unavailable - missing env vars')
    return Promise.resolve({ data: null, error: new Error('Supabase not configured') })
  }
  return fn(...args)
}
