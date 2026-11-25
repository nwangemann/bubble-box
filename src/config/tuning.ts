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
  /**
   * Spin from a curved swipe. Only the last `window` seconds count, in steps of at least `spacing`;
   * bends below `slop` are straight, and one sharper than `corner` is a change of mind. `full` is
   * the swipe speed that gives all of it. `curve` bends the path, `grip` kicks off side walls.
   */
  spin: {
    window: 0.22,
    spacing: 0.04,
    slop: 0.25,
    corner: 1.2,
    gain: 3.2,
    max: 6,
    full: 1.5,
    curve: 0.45,
    fade: 1.8,
    grip: 0.35,
    keep: 0.6,
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
  /** Light from glowing bubbles; seconds for water to settle in an empty room. */
  walls: { glow: 0.9, settle: 1.2 },
  /** The preview picker. Pixels for layout; world units (half a cell wide) and seconds for motion. */
  preview: {
    side: 18,
    gap: 10,
    top: 104,
    bottom: 80,
    label: 26,
    corner: 14,
    /** More options than this take three columns. */
    wideUpTo: 6,
    /** Tallest cell against its width. */
    tallest: 1.25,
    finger: 9,
    depth: 3,
    z: 0.9,
    drift: 0.06,
    breath: 0.025,
    grow: 0.7,
    closing: 0.5,
    press: 0.14,
    stagger: 0.12,
    melt: 1.2,
    radius: { bubble: 0.86, glass: 0.5, box: 0.28, light: 0.28, meet: 0.3, pop: 0.34, tap: 0.4 },
    /** Length of each loop, and when its event happens, when it clears and where it stands still. */
    loop: { bubble: 3.4, box: 4.5, light: 4.5, feel: 6.8, glass: 4, tap: 4.4, meet: 4.4, pop: 4.4 },
    act: { feel: 0.9, glass: 0.3, tap: 1.5, pop: 1.5 },
    clear: { feel: 5.8, meet: 2.8, pop: 3.3, tap: 3.4 },
    still: {
      bubble: 1.5,
      box: 1.5,
      light: 1.5,
      feel: 1.8,
      glass: 1,
      tap: 1.85,
      meet: 1.75,
      pop: 2,
    },
  },
} as const;
