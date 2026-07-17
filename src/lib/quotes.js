const QUOTES = [
  { text: 'Small steps every day add up to big journeys together.', author: 'TogetherGoals' },
  { text: 'Discipline is choosing what you want most over what you want now.', author: 'Abraham Lincoln' },
  { text: 'We rise by lifting each other.', author: 'Robert Ingersoll' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Proverb' },
  { text: 'Consistency beats intensity, every single time.', author: 'TogetherGoals' },
  { text: 'Love is not just looking at each other, it is looking outward in the same direction.', author: 'Antoine de Saint-Exupéry' },
  { text: 'A little progress each day adds up to big results.', author: 'Satya Nani' },
  { text: 'Together is a wonderful place to start.', author: 'TogetherGoals' },
  { text: 'Motivation gets you started. Habit keeps you going.', author: 'Jim Ryun' },
  { text: 'Fall in love with the process and the results will come.', author: 'Eric Thomas' },
  { text: 'Someone is cheering for you today — and they live with you.', author: 'TogetherGoals' },
]

/**
 * Stable quote-of-the-day: the same date always yields the same quote, so it doesn't
 * flicker on every render or re-fetch.
 */
export const quoteOfTheDay = (date = new Date()) => {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86_400_000)
  return QUOTES[dayOfYear % QUOTES.length]
}

export default QUOTES
