import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * The app runs in one of two modes. If both env vars are present we talk to a real
 * Supabase project; otherwise we fall back to the seeded demo repository so the UI is
 * fully explorable with zero configuration. Nothing outside src/data/ needs to know.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * "Remember me" maps directly onto session persistence: remembered sessions survive a
 * browser restart in localStorage, unremembered ones die with the tab in sessionStorage.
 */
const REMEMBER_KEY = 'tg.remember'

export const setRememberMe = (value) => {
  window.localStorage.setItem(REMEMBER_KEY, value ? '1' : '0')
}

export const getRememberMe = () => window.localStorage.getItem(REMEMBER_KEY) !== '0'

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: getRememberMe() ? window.localStorage : window.sessionStorage,
      },
    })
  : null
