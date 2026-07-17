import { subDays, formatISO } from 'date-fns'
import { dateKey, todayKey } from '../lib/format'
import { xpForCompletion } from '../lib/gamification'
import { PRESETS } from './catalog'

/**
 * Demo repository.
 *
 * Backs the entire app with localStorage and a seeded 120-day history so TogetherGoals
 * is fully usable — streaks, charts, heatmap, partner comparison — before anyone touches
 * Supabase. It implements exactly the same async contract as supabaseRepo, so swapping
 * between them is a one-line change in data/index.js and nothing upstream notices.
 */

const DB_KEY = 'tg.demo.db'
const SESSION_KEY = 'tg.demo.session'

const uid = () => Math.random().toString(36).slice(2, 10)
const clone = (v) => JSON.parse(JSON.stringify(v))
const sleep = (ms = 120) => new Promise((r) => setTimeout(r, ms))

/* ------------------------------------------------------------------ seeding */

const YOU = 'demo-you'
const PARTNER = 'demo-partner'

/**
 * Realistic-looking history: partners are strong but human — they miss days.
 *
 * The last two weeks are deliberately strong so the demo opens on a live streak;
 * further back it's messier, which is what makes the heatmap and insights interesting.
 */
function seedProgress(goals, ownerBias) {
  const rows = []
  for (let d = 119; d >= 0; d -= 1) {
    const day = subDays(new Date(), d)
    const date = dateKey(day)
    const isRecent = d <= 13
    const isToday = d === 0

    const isWeekend = [0, 6].includes(day.getDay())
    const dayEnergy = Math.random() * 0.3 + (isRecent ? 0.75 : ownerBias) - (isWeekend ? 0.1 : 0)

    // Older days get skipped sometimes; the current streak stays intact.
    if (!isRecent && Math.random() > 0.88) continue

    for (const goal of goals) {
      // Older days are patchy. Recent days are logged in full — a single missed goal
      // out of eight drags the daily mean under the streak threshold, and the demo is
      // supposed to open on a live streak.
      if (!isRecent && Math.random() > 0.82) continue

      // Today is deliberately half-finished — there's something left to tap.
      const ratio = isToday
        ? Math.random() * 0.5 + 0.1
        : isRecent
          ? Math.min(1.15, Math.random() * 0.35 + 0.8)
          : Math.min(1.15, Math.max(0.2, dayEnergy + Math.random() * 0.35))

      // Whole-number goals ("1 gym session") must never seed as 0.2 of a session.
      const raw = goal.target * ratio
      const value =
        goal.module === 'career'
          ? Math.round(Math.random() * 3) + 1
          : goal.target <= 2
            ? Math.round(raw)
            : Math.round(raw * 10) / 10

      if (value > 0) rows.push({ id: uid(), goal_id: goal.id, user_id: goal.user_id, date, value })
    }
  }
  return rows
}

function seedGoalsFor(userId, coupleId, picks) {
  return picks.map(({ module, index, ...overrides }) => {
    const preset = PRESETS[module][index]
    return {
      id: uid(),
      user_id: userId,
      couple_id: coupleId,
      module,
      title: preset.title,
      description: '',
      category_id: preset.category_id,
      target: preset.target,
      unit: preset.unit,
      current: 0,
      deadline: null,
      priority: 'medium',
      difficulty: 'medium',
      notes: '',
      status: 'in_progress',
      archived: false,
      created_at: formatISO(subDays(new Date(), 120)),
      ...overrides,
    }
  })
}

function seed() {
  const coupleId = 'demo-couple'

  const profiles = [
    {
      id: YOU,
      name: 'Rachit',
      email: 'rachit@togethergoals.app',
      avatar_url: null,
      xp: 1840,
      created_at: formatISO(subDays(new Date(), 120)),
    },
    {
      id: PARTNER,
      name: 'Riya',
      email: 'riya@togethergoals.app',
      avatar_url: null,
      xp: 2120,
      created_at: formatISO(subDays(new Date(), 120)),
    },
  ]

  const couples = [
    {
      id: coupleId,
      invite_code: 'LOVE24',
      created_by: YOU,
      relationship_since: dateKey(subDays(new Date(), 700)),
      created_at: formatISO(subDays(new Date(), 120)),
    },
  ]

  const couple_members = [
    { id: uid(), couple_id: coupleId, user_id: YOU, joined_at: formatISO(subDays(new Date(), 120)) },
    { id: uid(), couple_id: coupleId, user_id: PARTNER, joined_at: formatISO(subDays(new Date(), 119)) },
  ]

  const yourGoals = seedGoalsFor(YOU, coupleId, [
    { module: 'health', index: 0 }, // water
    { module: 'health', index: 3 }, // fruits
    { module: 'health', index: 9 }, // gym
    { module: 'health', index: 11 }, // meditate
    { module: 'career', index: 0, current: 26, deadline: dateKey(subDays(new Date(), -30)), priority: 'high', difficulty: 'hard' },
    { module: 'career', index: 1, current: 61, priority: 'high' },
    { module: 'career', index: 2, current: 140, difficulty: 'easy' },
    { module: 'daily', index: 0 },
    { module: 'daily', index: 2 },
  ])

  const partnerGoals = seedGoalsFor(PARTNER, coupleId, [
    { module: 'health', index: 0 },
    { module: 'health', index: 4 }, // vegetables
    { module: 'health', index: 10 }, // yoga
    { module: 'health', index: 7 }, // running
    { module: 'career', index: 6, current: 18, priority: 'high', difficulty: 'hard' }, // learn AI
    { module: 'career', index: 3, current: 31 }, // job applications
    { module: 'daily', index: 1 },
    { module: 'daily', index: 4 },
  ])

  const goals = [...yourGoals, ...partnerGoals]
  const goal_progress = [...seedProgress(yourGoals, 0.5), ...seedProgress(partnerGoals, 0.58)]

  // Today's counters reflect today's logged values.
  const today = todayKey()
  for (const goal of goals) {
    if (goal.module === 'career') continue
    const row = goal_progress.find((r) => r.goal_id === goal.id && r.date === today)
    goal.current = row?.value ?? 0
  }

  const activity = goal_progress
    .filter((r) => {
      const goal = goals.find((g) => g.id === r.goal_id)
      return goal && (goal.module === 'career' ? r.value > 0 : r.value >= goal.target)
    })
    .slice(-40)
    .map((r) => {
      const goal = goals.find((g) => g.id === r.goal_id)
      const profile = profiles.find((p) => p.id === r.user_id)
      return {
        id: uid(),
        couple_id: coupleId,
        user_id: r.user_id,
        type: 'goal_completed',
        message: `${profile.name} completed ${goal.title}`,
        created_at: `${r.date}T18:00:00.000Z`,
      }
    })
    .reverse()

  return {
    profiles,
    couples,
    couple_members,
    goals,
    goal_progress,
    activity,
    user_achievements: [],
    seeded_at: formatISO(new Date()),
  }
}

/* ---------------------------------------------------------------- storage */

let listeners = new Set()

function read() {
  const raw = window.localStorage.getItem(DB_KEY)
  if (raw) {
    try {
      return JSON.parse(raw)
    } catch {
      /* corrupt blob — fall through and reseed */
    }
  }
  const fresh = seed()
  window.localStorage.setItem(DB_KEY, JSON.stringify(fresh))
  return fresh
}

function write(db) {
  window.localStorage.setItem(DB_KEY, JSON.stringify(db))
  // Mirrors Supabase realtime: anything that mutates notifies subscribers.
  for (const fn of listeners) fn()
}

const readSession = () => {
  const raw = window.localStorage.getItem(SESSION_KEY)
  return raw ? JSON.parse(raw) : null
}

/* ------------------------------------------------------------------- auth */

let authListeners = new Set()
const emitAuth = () => {
  const session = readSession()
  for (const fn of authListeners) fn(session)
}

export const mockRepo = {
  mode: 'demo',

  async getSession() {
    await sleep(60)
    return readSession()
  },

  onAuthStateChange(cb) {
    authListeners.add(cb)
    return () => authListeners.delete(cb)
  },

  /** Demo signup: creates a real local profile, but no partner — you'll see /connect. */
  async signUp({ name, email }) {
    await sleep()
    const db = read()
    const id = uid()
    db.profiles.push({
      id,
      name,
      email,
      avatar_url: null,
      xp: 0,
      created_at: formatISO(new Date()),
    })
    write(db)
    const session = { user: { id, email } }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    emitAuth()
    return session
  },

  /** Demo login: any credentials land you in the seeded couple as Rachit. */
  async signIn({ email }) {
    await sleep()
    const db = read()
    const profile = db.profiles.find((p) => p.email === email) ?? db.profiles[0]
    const session = { user: { id: profile.id, email: profile.email } }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    emitAuth()
    return session
  },

  async signOut() {
    await sleep(60)
    window.localStorage.removeItem(SESSION_KEY)
    emitAuth()
  },

  async resetPassword() {
    await sleep()
    return { demo: true }
  },

  async updatePassword() {
    await sleep()
    return { demo: true }
  },

  async deleteAccount() {
    await sleep()
    window.localStorage.removeItem(DB_KEY)
    window.localStorage.removeItem(SESSION_KEY)
    emitAuth()
  },

  /* --------------------------------------------------------------- profile */

  async getProfile(userId) {
    await sleep(50)
    return read().profiles.find((p) => p.id === userId) ?? null
  },

  async updateProfile(userId, patch) {
    await sleep(80)
    const db = read()
    const profile = db.profiles.find((p) => p.id === userId)
    Object.assign(profile, patch)
    write(db)
    return clone(profile)
  },

  /* ---------------------------------------------------------------- couple */

  async getCoupleState(userId) {
    await sleep(60)
    const db = read()
    const membership = db.couple_members.find((m) => m.user_id === userId)
    if (!membership) return { couple: null, partner: null, members: [] }

    const couple = db.couples.find((c) => c.id === membership.couple_id)
    const members = db.couple_members
      .filter((m) => m.couple_id === couple.id)
      .map((m) => db.profiles.find((p) => p.id === m.user_id))
      .filter(Boolean)

    return {
      couple: clone(couple),
      members: clone(members),
      partner: clone(members.find((p) => p.id !== userId) ?? null),
    }
  },

  async createCouple(userId) {
    await sleep()
    const db = read()
    const couple = {
      id: uid(),
      invite_code: Math.random().toString(36).slice(2, 8).toUpperCase(),
      created_by: userId,
      relationship_since: todayKey(),
      created_at: formatISO(new Date()),
    }
    db.couples.push(couple)
    db.couple_members.push({
      id: uid(),
      couple_id: couple.id,
      user_id: userId,
      joined_at: formatISO(new Date()),
    })
    write(db)
    return clone(couple)
  },

  async joinCouple(userId, code) {
    await sleep()
    const db = read()
    const couple = db.couples.find((c) => c.invite_code === code.trim().toUpperCase())
    if (!couple) throw new Error("We couldn't find that code. Double-check it with your partner?")

    const members = db.couple_members.filter((c) => c.couple_id === couple.id)
    if (members.some((m) => m.user_id === userId)) return clone(couple)
    if (members.length >= 2) throw new Error('That couple is already complete — only two people allowed 💜')

    db.couple_members.push({
      id: uid(),
      couple_id: couple.id,
      user_id: userId,
      joined_at: formatISO(new Date()),
    })
    write(db)
    return clone(couple)
  },

  async leaveCouple(userId) {
    await sleep()
    const db = read()
    db.couple_members = db.couple_members.filter((m) => m.user_id !== userId)
    write(db)
  },

  async updateCouple(coupleId, patch) {
    await sleep(80)
    const db = read()
    const couple = db.couples.find((c) => c.id === coupleId)
    Object.assign(couple, patch)
    write(db)
    return clone(couple)
  },

  /* ----------------------------------------------------------------- goals */

  async listGoals(userId) {
    await sleep(60)
    return clone(read().goals.filter((g) => g.user_id === userId))
  },

  async listCoupleGoals(coupleId) {
    await sleep(60)
    return clone(read().goals.filter((g) => g.couple_id === coupleId))
  },

  async createGoal(goal) {
    await sleep(90)
    const db = read()
    const row = {
      id: uid(),
      current: 0,
      description: '',
      notes: '',
      deadline: null,
      priority: 'medium',
      difficulty: 'medium',
      status: 'pending',
      archived: false,
      created_at: formatISO(new Date()),
      ...goal,
    }
    db.goals.push(row)
    write(db)
    return clone(row)
  },

  async updateGoal(goalId, patch) {
    await sleep(80)
    const db = read()
    const goal = db.goals.find((g) => g.id === goalId)
    Object.assign(goal, patch)
    write(db)
    return clone(goal)
  },

  async deleteGoal(goalId) {
    await sleep(80)
    const db = read()
    db.goals = db.goals.filter((g) => g.id !== goalId)
    db.goal_progress = db.goal_progress.filter((r) => r.goal_id !== goalId)
    write(db)
  },

  /**
   * Log today's value for a goal. This is the single write path for all progress:
   * it updates the counter, the progress row, XP and the shared activity feed
   * together, exactly like the Supabase RPC does.
   */
  async setGoalValue({ goalId, date = todayKey(), value }) {
    await sleep(70)
    const db = read()
    const goal = db.goals.find((g) => g.id === goalId)
    if (!goal) throw new Error('Goal not found')

    const next = Math.max(0, value)
    const wasComplete = goal.module === 'career' ? goal.current >= goal.target : goal.current >= goal.target
    goal.current = next

    if (goal.module === 'career') {
      goal.status = next >= goal.target ? 'completed' : next > 0 ? 'in_progress' : 'pending'
    }

    const existing = db.goal_progress.find((r) => r.goal_id === goalId && r.date === date)
    // For career goals the row records *today's* increment; the counter is cumulative.
    const rowValue = goal.module === 'career' ? (existing?.value ?? 0) + 1 : next
    if (existing) existing.value = rowValue
    else
      db.goal_progress.push({
        id: uid(),
        goal_id: goalId,
        user_id: goal.user_id,
        date,
        value: rowValue,
      })

    const nowComplete = next >= goal.target
    if (nowComplete && !wasComplete) {
      const profile = db.profiles.find((p) => p.id === goal.user_id)
      profile.xp = (profile.xp ?? 0) + xpForCompletion(goal)
      db.activity.unshift({
        id: uid(),
        couple_id: goal.couple_id,
        user_id: goal.user_id,
        type: 'goal_completed',
        message: `${profile.name} completed ${goal.title}`,
        created_at: formatISO(new Date()),
      })
      db.activity = db.activity.slice(0, 60)
    }

    write(db)
    return clone(goal)
  },

  /* -------------------------------------------------------------- progress */

  async listProgress(userId, days = 365) {
    await sleep(60)
    const from = dateKey(subDays(new Date(), days))
    return clone(read().goal_progress.filter((r) => r.user_id === userId && r.date >= from))
  },

  /* -------------------------------------------------------------- activity */

  async listActivity(coupleId, limit = 12) {
    await sleep(60)
    return clone(
      read()
        .activity.filter((a) => a.couple_id === coupleId)
        .slice(0, limit),
    )
  },

  /* -------------------------------------------------------------- realtime */

  /** Same shape as the Supabase channel: any local write pings every subscriber. */
  subscribeToCouple(_coupleId, onChange) {
    listeners.add(onChange)
    return () => listeners.delete(onChange)
  },

  /** Escape hatch for the demo banner: wipe and reseed. */
  async resetDemo() {
    window.localStorage.removeItem(DB_KEY)
    read()
    for (const fn of listeners) fn()
  },
}

export default mockRepo
