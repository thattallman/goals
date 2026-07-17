import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import repo from '../data'
import { useAuth } from '../context/AuthContext'

/**
 * Keeps both partners' screens in sync.
 *
 * Mounted once in the app shell. When anything in the couple's data changes — Riya ticks
 * off a workout on her phone — the subscription invalidates the React Query cache and
 * Rachit's rings, charts and feed re-render with no refresh.
 *
 * Invalidations are debounced because a single progress write touches several tables and
 * would otherwise fire three refetches in a row.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const { couple, refreshCouple, refreshProfile } = useAuth()
  const timer = useRef(null)

  useEffect(() => {
    if (!couple?.id) return undefined

    const onChange = () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        queryClient.invalidateQueries()
        // Profile XP and couple membership live in context, not the query cache.
        refreshProfile()
        refreshCouple()
      }, 250)
    }

    const unsubscribe = repo.subscribeToCouple(couple.id, onChange)
    return () => {
      clearTimeout(timer.current)
      unsubscribe?.()
    }
  }, [couple?.id, queryClient, refreshCouple, refreshProfile])
}
