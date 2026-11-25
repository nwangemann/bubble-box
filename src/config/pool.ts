/** How a ball is marked. The cue ball is the plain one. */
export type BallKind = 'plain' | 'solid' | 'stripe' | 'eight';

/** The 8-ball trial, in the calm room's box. Lengths as in `tuning`; see docs/pool.md. */
export const POOL = {
  /** Every ball, the cue ball too: about a third of the largest calm bubble. */
  radius: 0.22,
  /** A ball drops when its middle is this close to where it would sit snug in a pocket. */
  mouth: 0.2,
  /**
   * The cue ball is launched as a calm bubble, with this feel's speed, but never grows. Power stops
   * rising after `charge` seconds, so taking time to aim costs nothing. It swells into the hand in
   * `appear` seconds; `held` is its opacity there.
   */
  cue: { speed: 1.6, charge: 0.8, appear: 0.16, held: 0.45 },
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
  /**
   * While holding, a line straight ahead. Before `place` seconds a swipe this fast hides it, and
   * steers. After, the finger is placing the shot: the line stays, shown over `ease` seconds, and
   * lifting sends the ball along it however the finger moves.
   */
  aim: { opacity: 0.5, swipe: 1, place: 0.35, ease: 0.15 },
  /**
   * A slight draw towards each pocket: acceleration where a ball sits snug, fading to none at `reach`. Where
   * it is stronger than `drag` even a resting ball drifts in.
   */
  draw: { strength: 0.18, reach: 0.75 },
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
  /**
   * Each ball: the cue, then the rack from its tip to the 8 behind. Colours are as far apart as seven
   * can be once hazed at the far wall, and to the colour-blind: check there before changing one.
   */
  looks: [
    { color: [0.93, 0.96, 1], kind: 'plain' },
    { color: [1, 0.88, 0.2], kind: 'stripe' },
    { color: [1, 0.88, 0.2], kind: 'solid' },
    { color: [0.2, 0.5, 1], kind: 'stripe' },
    { color: [0.9, 0.07, 0.12], kind: 'stripe' },
    { color: [0.2, 0.5, 1], kind: 'solid' },
    { color: [0.9, 0.07, 0.12], kind: 'solid' },
    { color: [0.48, 0.15, 0.8], kind: 'stripe' },
    { color: [0.48, 0.15, 0.8], kind: 'solid' },
    { color: [1, 0.45, 0], kind: 'stripe' },
    { color: [1, 0.45, 0], kind: 'solid' },
    { color: [0.1, 0.75, 0.35], kind: 'stripe' },
    { color: [0.1, 0.75, 0.35], kind: 'solid' },
    { color: [1, 0.55, 0.82], kind: 'stripe' },
    { color: [1, 0.55, 0.82], kind: 'solid' },
    { color: [0.03, 0.03, 0.04], kind: 'eight' },
  ] as { color: [number, number, number]; kind: BallKind }[],
  /**
   * A place for each ball to pot, at the top, in pixels: solids, the 8, stripes. `apart` is between
   * groups, `side` the least margin. One still on the table is a ring of its colour and a `ghost` of
   * itself; once potted it fills in over `fill` seconds.
   */
  row: { top: 84, gap: 23, apart: 10, side: 14, radius: 8.5, ghost: 0.3, ring: 0.85, fill: 0.35 },
  /** How balls look with distance, at the far wall: haze into the air, dimming, and duller shine. */
  far: { haze: 0.35, dim: 0.2, dull: 0.8 },
  /** Light of a ball's own colour round the near edge of each, gone at the far wall. */
  rim: 0.35,
  /**
   * How lively a ball is, 0 to 1: full at `speed`, following it over `ease` seconds. Its light comes
   * and goes with this, so nothing flashes.
   */
  lively: { speed: 1, ease: 0.15 },
  /**
   * What balls mark on the walls. Shadows straight across, gone at `reach` (the far wall's carry all
   * the way), widening by `spread` of the gap, and `touch` where one presses. While lively, `light` in
   * its colour within `lightReach`, at least `least` in every channel. `haze` is the air before the
   * far wall.
   */
  walls: {
    reach: 1.1,
    shadow: 0.6,
    spread: 0.06,
    touch: 0.8,
    light: 1.9,
    lightReach: 1.1,
    least: 0.25,
    haze: 0.4,
  },
  /**
   * What a ball leaves behind it, as in `config/trails` but pool's own: short, so it shows only which
   * way a ball goes and how fast. A point each `every` seconds, and at every contact that turns
   * it past cosine `corner`.
   */
  trail: {
    look: { id: 'wake', name: 'Wake', seconds: 1.2, width: 0.45, strength: 0.6, shown: 1.2 },
    every: 1 / 15,
    least: 0.01,
    corner: 0.98,
    most: 64,
  },
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
  /** Pockets as drawn. `side` is how far a middle one spreads each way; looks only, `mouth` decides. */
  holes: { side: 0.42, fill: 0.7, edge: 0.7 },
  hapticGap: 0.05,
  hapticLeast: 0.3,
};
