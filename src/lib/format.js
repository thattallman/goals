import { format, formatDistanceToNow, parseISO, startOfWeek } from 'date-fns'

/** Canonical date key used across goal_progress, heatmaps and charts. */
export const dateKey = (d = new Date()) => format(d, 'yyyy-MM-dd')

export const todayKey = () => dateKey(new Date())

/** Monday-based week start, matching the ISO week used by weekly reports. */
export const weekStartKey = (d = new Date()) => dateKey(startOfWeek(d, { weekStartsOn: 1 }))

export const toDate = (value) => (typeof value === 'string' ? parseISO(value) : value)

export const prettyDate = (value) => format(toDate(value), 'd MMM yyyy')

export const shortDay = (value) => format(toDate(value), 'EEE')

export const relativeTime = (value) => formatDistanceToNow(toDate(value), { addSuffix: true })

/** Clamp a value into 0–100 and round, so progress can never render out of bounds. */
export const pct = (current, target) => {
  if (!target || target <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)))
}

export const greeting = (date = new Date()) => {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

/** Deterministic pastel gradient per user, so avatars are stable without images. */
export const avatarGradient = (seed = '') => {
  const palettes = [
    'from-brand-500 to-blush-500',
    'from-blush-500 to-orange-400',
    'from-mint-500 to-brand-500',
    'from-sky-500 to-brand-600',
    'from-amber-400 to-blush-500',
  ]
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return palettes[hash % palettes.length]
}
