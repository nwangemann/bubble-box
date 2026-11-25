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
  /**
   * A flick starts on a bubble, travels `slop` within `decide` seconds and lifts within `seconds`,
   * still moving at `least` or more. `gain` is how much of the finger's speed the bubble takes,
   * `forward` how much of that goes deeper, `heaviness` how much a large one resists, `twist` the
   * spin from catching its edge, `wobble` how much it gives.
   */
  flick: {
    decide: 0.12,
    seconds: 0.3,
    slop: 0.08,
    least: 0.6,
    gain: 0.45,
    max: 5,
    forward: 0.2,
    heaviness: 1.2,
    twist: 1.2,
    wobble: 0.6,
  },
  /**
   * Gravity from tilting the phone away from how it rests. Tilts are in shares of gravity, about
   * radians: below `slop` nothing, from `full` all of `pull`, in units per second squared. `ease`
   * smooths it and `settle` is how slowly a kept tilt becomes the new rest, in seconds. `interval`
   * is milliseconds between sensor readings.
   */
  tilt: { slop: 0.05, full: 0.6, pull: 0.7, ease: 0.15, settle: 10, interval: 33 },
  /** Light from bubbles meeting and popping. */
  burst: { max: 8, minClosing: 0.18, pairPause: 0.45 },
  /**
   * Merging. Takes `seconds`, drawn together at rate `pull`. Nothing grows past `maxRadius`; such
   * pairs bounce. `reach` is how far edges bulge to meet, easing at rate `ease`, never past
   * `maxReach`. `stretch` draws the merged bubble out along the join, `twist` is the spin from
   * meeting off centre, and pieces of a pop wait `shy` seconds.
   */
  merge: {
    seconds: 1.1,
    pull: 4.5,
    maxRadius: 0.8,
    reach: 0.36,
    maxReach: 0.45,
    ease: 16,
    stretch: 30,
    twist: 0.5,
    shy: 1.2,
  },
  /**
   * Bubbles drawing each other. It speeds nothing past `fastest`. A pair right beside each other
   * tires in `tire` seconds, at once on touching, and is fresh again after `rest`. `usual` is the
   * radius at which size makes no difference.
   */
  pull: { fastest: 0.6, tire: 2.5, rest: 7, usual: 0.3 },
  /**
   * Trails. A point is laid each `spacing`, no more often than `interval` seconds, but always at a
   * turn sharper than cosine `corner` once `least` has passed. `hold` is how firmly a trail keeps
   * the way it lies. It is drawn in pieces of `piece` points, narrowing by the power `taper` to
   * `thinnest` pixels, hidden within `hidden` radii of its bubble and full from `shown`.
   * Its first end comes to a point over `open` seconds. Images shrink by the share `shrink` over
   * their life; bubbles under radius `small` space theirs as if that large.
   */
  trail: {
    spacing: 0.12,
    interval: 1 / 10,
    least: 0.012,
    corner: 0.99,
    maxPoints: 64,
    hold: 0.6,
    piece: 6,
    taper: 0.8,
    thinnest: 0.8,
    hidden: 0.95,
    shown: 1.7,
    open: 0.45,
    shrink: 0.22,
    small: 0.2,
  },
  /** Popping into pieces. */
  brood: { minRadius: 0.16, size: 0.42, speed: 0.9 },
  /**
   * Two-finger swipe: two fingers down less than `fresh` seconds that both travel `slop`. Fingers
   * that linger longer grow bubbles instead.
   */
  sweep: { slop: 0.1, reach: 0.16, fresh: 0.4 },
  /** Swipe speed is measured over the last `window` seconds, and never over less than `least`. */
  swipe: { window: 0.08, least: 0.016 },
  /** How firmly bubbles held by different fingers press apart each step, 0 to 1. */
  heldPush: 0.2,
  hapticMinImpact: 0.35,
  /** Light from glowing bubbles; seconds for water to settle in an empty room. */
  walls: { glow: 0.9, settle: 1.2 },
  /**
   * Showdown. The arena is shallower than the box so everyone is seen. Entrants line up at depth
   * `lineup`, nearer than the middle, so they start large. They wait `ready`
   * seconds, set off at `start`, and turn towards the nearest rival: rate `least`, gaining `gain` for
   * each second past `patience` without a clash, up to `most`, at speed `chase`. `slow` is the last
   * pair's slow motion: from `gap` apart, down to `pace`; `blow` and `after` hold it past the final
   * knock-out. The winner basks, then rises at rate `rise` to `podium`, whose size adds `gain`
   * of whatever it has grown, up to `most`.
   */
  showdown: {
    depth: 3.6,
    lineup: 1.2,
    radius: 0.16,
    /** Winners grow at rate `swell`, up to `largest`, which just fits across the arena. */
    largest: 0.8,
    swell: 4,
    /** Share of its new size at which a winner can clash again. */
    grown: 0.95,
    columns: 3,
    /** Share of the arena's height the line-up fills, and the least between its rows. */
    spread: 0.6,
    gap: 0.56,
    ready: 2.8,
    start: 0.32,
    least: 0,
    gain: 0.4,
    patience: 2.4,
    most: 3,
    chase: 0.85,
    slow: { gap: 0.45, pace: 0.35, blow: 0.25, after: 0.25 },
    bask: 0.5,
    rise: 2.6,
    podium: { y: -0.02, z: 0.75, r: 0.5, gain: 0.8, most: 0.74 },
    /**
     * Surfaces ringing. `tension` sets how quick, `viscosity` how soon it fades; `stretch` and `pear`
     * are the blows from draining in, `blow` from a pop beside it, `most` the largest swings.
     */
    ring: {
      tension: 0.2,
      viscosity: 0.008,
      stretch: 24,
      pear: 14,
      blow: 1.6,
      most2: 0.26,
      most3: 0.1,
    },
    /** How long spray from a clash lasts. */
    clash: 1.7,
    /** Calm multiplies speed, for Reduce Motion. */
    calm: 0.7,
    motes: 26,
    /** Neck between coalescing bubbles, against the smaller; fine droplets thrown off. */
    neck: 0.95,
    spray: 22,
  },
  /** The bubble maker. Shares of the screen for the bubble; pixels for slider names. */
  maker: { width: 0.9, height: 0.42, label: 56 },
  /** The menu's tiles, in pixels. */
  menu: { columns: 3, side: 16, gap: 8, height: 64, corner: 14, widest: 480 },
  /** The preview picker. Pixels for layout; world units (half a cell wide) and seconds for motion. */
  preview: {
    side: 18,
    gap: 10,
    top: 104,
    bottom: 80,
    label: 26,
    /** Room for the sliders under Box's options. */
    sliders: 52,
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
    /** In Trail, how it sets off and bends. */
    travel: { x: 0.8, y: 0.62, z: 0.7, spin: 1.4 },
    /** In Pull, speed and how far each passes from the middle. */
    passing: { speed: 0.3, aside: 0.36 },
    press: 0.14,
    /** The smaller bubble in Contact, against the larger. */
    lesser: 0.7,
    stagger: 0.12,
    melt: 1.2,
    radius: {
      bubble: 0.86,
      glass: 0.5,
      box: 0.28,
      light: 0.28,
      meet: 0.3,
      pop: 0.34,
      tap: 0.4,
      contact: 0.4,
      pull: 0.24,
      trail: 0.2,
    },
    /** Length of each loop, and when its event happens, when it clears and where it stands still. */
    loop: {
      bubble: 3.4,
      box: 4.5,
      light: 4.5,
      feel: 6.8,
      glass: 4,
      tap: 4.4,
      meet: 4.4,
      pop: 4.4,
      contact: 4.8,
      pull: 5.4,
      trail: 5,
    },
    act: { feel: 0.9, glass: 0.3, tap: 1.5, pop: 1.5 },
    clear: { feel: 5.8, contact: 3.8, pull: 4.5, meet: 2.8, pop: 3.3, tap: 3.4 },
    still: {
      bubble: 1.5,
      box: 1.5,
      light: 1.5,
      feel: 1.8,
      glass: 1,
      tap: 1.85,
      contact: 1.6,
      pull: 2.4,
      trail: 2.4,
      meet: 1.75,
      pop: 2,
    },
  },
} as const;
