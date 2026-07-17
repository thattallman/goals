import { isSupabaseConfigured } from '../lib/supabase'
import { supabaseRepo } from './supabaseRepo'
import { mockRepo } from './mockRepo'

/**
 * The one place the app decides where its data lives.
 *
 * Add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to .env and the whole app switches to
 * the real backend — no other file changes. Without them we run the seeded demo, so the
 * UI is never a blank shell.
 *
 * Both repositories implement the same contract:
 *
 *   auth      getSession · onAuthStateChange · signUp · signIn · signOut
 *             resetPassword · updatePassword · deleteAccount
 *   profile   getProfile · updateProfile
 *   couple    getCoupleState · createCouple · joinCouple · leaveCouple · updateCouple
 *   goals     listGoals · listCoupleGoals · createGoal · updateGoal · deleteGoal · setGoalValue
 *   progress  listProgress
 *   activity  listActivity
 *   realtime  subscribeToCouple(coupleId, onChange) -> unsubscribe
 */
export const repo = isSupabaseConfigured ? supabaseRepo : mockRepo

export const isDemo = repo.mode === 'demo'

export default repo
