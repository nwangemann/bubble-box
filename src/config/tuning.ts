/** Every number that shapes the feel. Units: 1 = half the screen width; seconds; units per second. */
export const TUNING = {
  box: { depth: 5, focal: 3.2 },
  grow: { minRadius: 0.07, maxRadius: 0.68, tau: 2.2, follow: 14 },
  launch: {
    base: 1.7,
    hold: 1.5,
    swipe: 0.5,
    swipeForward: 0.12,
    maxSwipe: 3.5,
    heaviness: 0.9,
  },
  wobble: { stiffness: 11, damping: 2.2, impact: 0.8, max: 0.26 },
  step: 1 / 120,
  maxFrame: 1 / 20,
  maxSpeed: 8,
  maxBubbles: 10,
  popSeconds: 0.7,
  rippleSeconds: 1.6,
  maxRipples: 16,
  /** Waves across the screen side. */
  glass: { seconds: 3, speed: 0.95, maxWaves: 4, minImpact: 0.15 },
  /** A touch this short and still is a tap. `reach` is the smallest target radius. */
  tap: { seconds: 0.22, slop: 0.08, reach: 0.12 },
  /** Light from bubbles meeting and popping. */
  burst: { max: 8, minClosing: 0.18, pairPause: 0.45 },
  /** Popping into pieces. */
  brood: { minRadius: 0.16, size: 0.42, speed: 0.9 },
  /** Two-finger swipe. `undo` forgives a bubble begun by the first finger. */
  sweep: { slop: 0.06, reach: 0.16, undo: 0.35 },
  hapticMinImpact: 0.35,
} as const;
