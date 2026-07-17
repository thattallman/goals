import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import repo from '../data'

const AuthContext = createContext(null)

/**
 * Session + profile + couple, resolved once and shared by the whole tree.
 *
 * Everything downstream can assume that when `loading` is false, either `user` is null
 * (show auth pages) or `profile` and `coupleState` are populated (show the app).
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [coupleState, setCoupleState] = useState({ couple: null, partner: null, members: [] })
  const [loading, setLoading] = useState(true)

  const user = session?.user ?? null

  const hydrate = useCallback(async (activeSession) => {
    if (!activeSession?.user) {
      setProfile(null)
      setCoupleState({ couple: null, partner: null, members: [] })
      return
    }
    const [nextProfile, nextCouple] = await Promise.all([
      repo.getProfile(activeSession.user.id),
      repo.getCoupleState(activeSession.user.id),
    ])
    setProfile(nextProfile)
    setCoupleState(nextCouple)
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const initial = await repo.getSession()
        if (cancelled) return
        setSession(initial)
        await hydrate(initial)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    const unsubscribe = repo.onAuthStateChange(async (next) => {
      setSession(next)
      await hydrate(next)
      // A different user must never see the previous one's cached rows.
      queryClient.clear()
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [hydrate, queryClient])

  const refreshCouple = useCallback(async () => {
    if (!user) return
    const next = await repo.getCoupleState(user.id)
    setCoupleState(next)
  }, [user])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    setProfile(await repo.getProfile(user.id))
  }, [user])

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      couple: coupleState.couple,
      partner: coupleState.partner,
      members: coupleState.members,
      /** True once both people are in — gates the "waiting for partner" state. */
      isPaired: Boolean(coupleState.partner),
      loading,
      refreshCouple,
      refreshProfile,
      signIn: (payload) => repo.signIn(payload),
      signUp: (payload) => repo.signUp(payload),
      signOut: () => repo.signOut(),
      resetPassword: (email) => repo.resetPassword(email),
      updatePassword: (password) => repo.updatePassword(password),
      deleteAccount: () => repo.deleteAccount(),
    }),
    [session, user, profile, coupleState, loading, refreshCouple, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
