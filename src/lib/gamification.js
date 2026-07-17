/**
 * XP, levels and badges.
 *
 * Levelling uses a square-root curve: early levels arrive fast (the Duolingo trick
 * of front-loading rewards), later ones take real work.
 */

const XP_PER_LEVEL_BASE = 100

export const levelFromXp = (xp = 0) => Math.floor(Math.sqrt(Math.max(0, xp) / XP_PER_LEVEL_BASE)) + 1

export const xpForLevel = (level) => (level - 1) ** 2 * XP_PER_LEVEL_BASE

/** Progress within the current level, for the XP bar. */
export const levelProgress = (xp = 0) => {
  const level = levelFromXp(xp)
  const floor = xpForLevel(level)
  const ceiling = xpForLevel(level + 1)
  const span = ceiling - floor
  return {
    level,
    xp,
    into: xp - floor,
    needed: span,
    remaining: ceiling - xp,
    percent: span > 0 ? Math.round(((xp - floor) / span) * 100) : 0,
  }
}

/** Harder goals are worth more — difficulty is a multiplier, not a label. */
const DIFFICULTY_XP = { easy: 10, medium: 20, hard: 35 }

export const xpForCompletion = (goal) => DIFFICULTY_XP[goal?.difficulty] ?? 20

/** The couple's level is driven by their combined XP, so it only moves together. */
export const coupleLevel = (yourXp = 0, partnerXp = 0) => levelFromXp(yourXp + partnerXp)

export const ACHIEVEMENTS = [
  {
    key: 'first_step',
    emoji: '🌱',
    title: 'First Step',
    description: 'Complete your very first goal.',
    test: ({ totalCompletions }) => totalCompletions >= 1,
  },
  {
    key: 'fitness_freak',
    emoji: '🏃',
    title: 'Fitness Freak',
    description: 'Complete 25 workout goals.',
    test: ({ workoutCompletions }) => workoutCompletions >= 25,
  },
  {
    key: 'coding_beast',
    emoji: '💻',
    title: 'Coding Beast',
    description: 'Complete 25 career goals.',
    test: ({ careerCompletions }) => careerCompletions >= 25,
  },
  {
    key: 'healthy_hero',
    emoji: '🥗',
    title: 'Healthy Hero',
    description: 'Complete 25 health goals.',
    test: ({ healthCompletions }) => healthCompletions >= 25,
  },
  {
    key: 'week_warrior',
    emoji: '⚡',
    title: 'Week Warrior',
    description: 'Hit a 7 day streak.',
    test: ({ streak }) => streak >= 7,
  },
  {
    key: 'streak_30',
    emoji: '🔥',
    title: '30 Day Streak',
    description: 'Show up 30 days in a row.',
    test: ({ streak, longest }) => Math.max(streak, longest) >= 30,
  },
  {
    key: 'perfect_week',
    emoji: '❤️',
    title: 'Perfect Week',
    description: 'Score 100% every day for a full week.',
    test: ({ perfectDays }) => perfectDays >= 7,
  },
  {
    key: 'couple_champions',
    emoji: '👑',
    title: 'Couple Champions',
    description: 'Both partners finish all daily goals on the same day.',
    test: ({ sharedPerfectDays }) => sharedPerfectDays >= 1,
  },
  {
    key: 'century',
    emoji: '💯',
    title: 'Centurion',
    description: 'Complete 100 goals in total.',
    test: ({ totalCompletions }) => totalCompletions >= 100,
  },
  {
    key: 'level_10',
    emoji: '🌟',
    title: 'Rising Star',
    description: 'Reach level 10.',
    test: ({ xp }) => levelFromXp(xp) >= 10,
  },
]

/**
 * Evaluate every badge against a stats snapshot.
 * Returns the full catalogue so the UI can show locked badges too — seeing what's
 * *almost* earned is most of the motivation.
 */
export const evaluateAchievements = (stats = {}) =>
  ACHIEVEMENTS.map((a) => ({ ...a, earned: Boolean(a.test(stats)) }))
