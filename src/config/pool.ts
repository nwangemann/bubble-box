/** The 8-ball trial, in the calm room's box. Lengths as in `tuning`; see docs/pool.md. */
export const POOL = {
  radius: 0.15,
  /** A ball drops when its middle is this close to a pocket's point. */
  pocket: 0.55,
  /**
   * The cue ball is launched as a calm bubble, with this feel's speed. Growing, it is heavier the
   * longer it is held; otherwise it is always the size of the rest. `held` is its opacity in the hand.
   */
  cue: { grows: true, speed: 1.6, held: 0.45 },
  /** Constant slowing, and how long spin lasts in seconds. */
  drag: 0.12,
  spinFade: 1.8,
  /** How far the cue ball's spin bends its path. */
  curve: 0.45,
  /** Speed kept between balls and off cushions, and how firmly a cushion grips. */
  ballBounce: 0.95,
  cushion: 0.8,
  grip: 0.12,
  step: 1 / 120,
  /** Most contacts solved in one step. */
  maxEvents: 64,
  /** While holding, a line straight ahead, gone when the finger swipes this fast. */
  aim: { opacity: 0.5, swipe: 1 },
  /**
   * A slight draw towards each pocket: acceleration at its very point, fading to none at `reach`. Where
   * it is stronger than `drag` even a resting ball drifts in.
   */
  draw: { strength: 0.3, reach: 1.15 },
  /** How long a ball takes to sink into a pocket, or an old cue ball to fade. */
  sink: 0.5,
  /** Seconds of stillness before a cleared table is set again. */
  again: 1.2,
  /**
   * The rack is a pyramid, its tip towards the viewer at this share of the depth: 1, 4 and 9 balls and
   * one behind, all touching but for `gap`, too small to see. Equal balls cannot pass a soft hit on to
   * the middle ones, so the first touch also springs them apart, at `burst` of its speed.
   */
  rack: { z: 0.55, gap: 1e-6, burst: 0.18 },
  /** Colour of each ball: the cue, then the rack from its tip to the 8 behind. `stripe` ones are banded. */
  looks: [
    { color: [0.93, 0.96, 1], stripe: 0 },
    { color: [1, 0.75, 0.2], stripe: 1 },
    { color: [1, 0.75, 0.2], stripe: 0 },
    { color: [0.28, 0.55, 1], stripe: 1 },
    { color: [1, 0.34, 0.34], stripe: 1 },
    { color: [0.28, 0.55, 1], stripe: 0 },
    { color: [1, 0.34, 0.34], stripe: 0 },
    { color: [0.66, 0.42, 1], stripe: 1 },
    { color: [0.66, 0.42, 1], stripe: 0 },
    { color: [1, 0.52, 0.16], stripe: 1 },
    { color: [1, 0.52, 0.16], stripe: 0 },
    { color: [0.3, 0.85, 0.55], stripe: 1 },
    { color: [0.3, 0.85, 0.55], stripe: 0 },
    { color: [0.75, 0.2, 0.38], stripe: 1 },
    { color: [0.75, 0.2, 0.38], stripe: 0 },
    { color: [0.07, 0.08, 0.1], stripe: 0 },
  ],
  /** Where potted balls rest: pixels. */
  row: { top: 78, gap: 24, radius: 9 },
  /** How balls haze with distance, and the shadow each drops on the far wall. */
  haze: 0.3,
  shadow: 0.35,
  look: {
    backdrop: ['#12304a', '#04080f'] as [string, string],
    ink: [150, 205, 240] as [number, number, number],
    edgeOpacity: 0.34,
    grid: 6,
    gridOpacity: 0.07,
    faceOpacity: 0.012,
    wallOpacity: 1,
    softness: 0,
  },
  holes: { fill: 0.7, edge: 0.7 },
  hapticGap: 0.05,
  hapticLeast: 0.3,
};
