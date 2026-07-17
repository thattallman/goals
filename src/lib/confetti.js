import confetti from 'canvas-confetti'

const BRAND = ['#7C3AED', '#EC4899', '#10B981', '#F59E0B', '#A78BFA']

const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/** A quick burst — used when a single goal is completed. */
export function celebrate() {
  if (reducedMotion()) return
  confetti({
    particleCount: 70,
    spread: 65,
    startVelocity: 38,
    origin: { y: 0.7 },
    colors: BRAND,
    scalar: 0.9,
    disableForReducedMotion: true,
  })
}

/**
 * The big one: fired only when *both* partners finish everything for the day.
 * Deliberately rare — it should feel like an event, not decoration.
 */
export function celebrateTogether() {
  if (reducedMotion()) return
  const end = Date.now() + 1400

  ;(function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.65 },
      colors: BRAND,
      disableForReducedMotion: true,
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.65 },
      colors: BRAND,
      disableForReducedMotion: true,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()

  // Heart-shaped finale in the middle.
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 100,
      origin: { y: 0.5 },
      shapes: ['circle'],
      colors: ['#EC4899', '#F472B6', '#7C3AED'],
      scalar: 1.3,
      disableForReducedMotion: true,
    })
  }, 500)
}
