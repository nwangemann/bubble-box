/** How a ball is marked. The cue ball is the plain one. */
export type BallKind = 'plain' | 'solid' | 'stripe' | 'eight';

/** The 8-ball trial, in the calm room's box. Lengths as in `tuning`; see docs/pool.md. */
type Rgb = [number, number, number];

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
  aim: {
    opacity: 0.5,
    swipe: 1,
    place: 0.35,
    ease: 0.15,
    /** The pocket the line calls for the 8: a ring this many radii round where it would sit. */
    call: { size: 1.6, opacity: 0.7, width: 1.6 },
    /**
     * Aim as a cue (Aim in the menu, `config/poolOptions`), lying on the glass behind the ball in
     * the hand and pointing where it goes, `length` long, `butt` and `tip` its full widths, all in
     * box units. Its tip waits `short` px off the ball and draws back `pull` px as the shot charges.
     * Aimed straight at the far wall it points up the screen, leaning that way within `steady` px.
     * From the butt: it takes `share` of the length, then a `join` band, the shaft, a `ferrule` and
     * the `tip`. A `sheen` along the lit side rounds it.
     */
    cue: {
      length: 1.5,
      butt: 0.075,
      tip: 0.034,
      short: 4,
      pull: 22,
      steady: 24,
      opacity: 0.9,
      share: 0.34,
      join: 0.025,
      ferrule: 0.06,
      end: 0.025,
      colors: {
        butt: [52, 30, 20] as Rgb,
        join: [208, 176, 112] as Rgb,
        shaft: [228, 206, 160] as Rgb,
        ferrule: [242, 238, 228] as Rgb,
        tip: [72, 124, 196] as Rgb,
      },
      sheen: { width: 0.28, offset: 0.22, opacity: 0.45 },
    },
  },
  /** The 8 set back on its spot: seconds it takes to ease in, and steps along the line to find room. */
  spot: { ease: 0.6, step: 0.01 },
  /**
   * A slight draw towards each pocket: acceleration where a ball sits snug, fading to none at `reach`. Where
   * it is stronger than `drag` even a resting ball drifts in.
   */
  draw: { strength: 0.18, reach: 0.75 },
  /** How long a ball takes to sink into a pocket, or an old cue ball to fade. */
  sink: 0.5,
  /**
   * A potted ball, in seconds since it dropped. Its light `spill`s from the pocket over the walls,
   * rising over `rise` and gone by `gone`; a front of it crosses the walls at `speed`; from `leaves` a
   * mote carries it to its place in the row, `lands` there, and a ring `blooms` round it. `most` are
   * lit at once, the latest. All of it ends before a cleared table is set again.
   */
  pot: {
    spill: 1.9,
    rise: 0.12,
    gone: 1.1,
    ripple: 0.4,
    speed: 3.2,
    leaves: 0.3,
    lands: 0.95,
    blooms: 0.5,
    /** How bright a pot is by what it means: muted for a foul, more for the last of a group, most for the 8. */
    meaning: { foul: 0.4, last: 1.5, eight: 2.2 },
    /** The mote's size in the row's radii, how far its path bows, and its tail: how many, how far behind. */
    mote: { size: 2, bow: 0.22, tail: 18, lag: 0.007, strength: 0.55 },
    most: 4,
    /** With Reduce Motion there is only the light, this much of it, and the place fills. */
    calm: 0.5,
  },
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
   * itself; once its light lands it fills in over `fill` seconds.
   */
  row: {
    top: 84,
    gap: 23,
    apart: 10,
    side: 14,
    radius: 8.5,
    ghost: 0.3,
    ring: 0.85,
    fill: 0.35,
    /**
     * Player 1's half is the left, player 2's the right. Once the table is taken, each group moves
     * under its owner over `seconds`, solids bowing `bow` pixels below and stripes above.
     */
    swap: { seconds: 0.8, bow: 18 },
    /**
     * Whose turn: a line `below` the middle of the row under the shooter's half, from `inner` radii
     * off the middle to its end, sliding across in `seconds`. A shorter one `second` pixels under it
     * while they have two shots.
     */
    turn: { below: 16, width: 2, opacity: 0.6, inner: 1.7, seconds: 0.45, second: 5, short: 0.45 },
    /**
     * A game won: over `seconds` a ring of the room's ink lights round each of the winner's places
     * and the 8's, `out` pixels beyond them, from the 8 outwards (`spread` of the time between the
     * first and the last), and their line brightens to `line`. Play again shows after `after`
     * seconds.
     */
    win: { seconds: 1.4, spread: 0.5, out: 3, opacity: 0.75, width: 1.4, line: 1, after: 1.6 },
    /**
     * Wins since 8-ball was opened: a small figure `below` the row under the outer end of each
     * half, in the room's ink at `opacity`, once anyone has won. A new count fades in as the
     * winner's rings finish lighting.
     */
    tally: { below: 36, size: 13, opacity: 0.5 },
  },
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
  /**
   * The rooms pool can be played in, chosen by Cloth in its menu (`config/poolOptions`). `room` is
   * drawn as a calm box is; `air` is what far balls haze into, near the far wall's colour; `mark` is
   * the colour of the row's lines and rings, the count and play again; `rim` is each pocket's edge,
   * stroked in order, widest first.
   */
  tables: {
    space: {
      room: {
        backdrop: ['#12304a', '#04080f'] as [string, string],
        ink: [150, 205, 240] as [number, number, number],
        edgeOpacity: 0.34,
        grid: 6,
        gridOpacity: 0.07,
        faceOpacity: 0.012,
        wallOpacity: 1,
        softness: 0,
      },
      air: [0.05, 0.14, 0.22] as [number, number, number],
      mark: [150, 205, 240] as [number, number, number],
      rim: [{ color: [150, 205, 240] as Rgb, width: 1.4, opacity: 0.7 }],
    },
    felt: {
      room: {
        backdrop: ['#0f3322', '#04100a'] as [string, string],
        ink: [56, 184, 112] as [number, number, number],
        edgeOpacity: 0,
        grid: 0,
        gridOpacity: 0,
        faceOpacity: 0,
        wall: 'felt' as const,
        wallOpacity: 1,
        softness: 0,
      },
      air: [0.07, 0.2, 0.13] as [number, number, number],
      mark: [236, 228, 204] as [number, number, number],
      // Leather: a dark band, its body, and a sheen along the top.
      rim: [
        { color: [38, 20, 10] as Rgb, width: 7, opacity: 0.9 },
        { color: [104, 58, 30] as Rgb, width: 4.5, opacity: 1 },
        { color: [176, 116, 68] as Rgb, width: 1.2, opacity: 0.75 },
      ],
    },
  },
  /** Pockets as drawn. `side` is how far a middle one spreads each way; looks only, `mouth` decides. */
  holes: { side: 0.42, fill: 0.7 },
  hapticGap: 0.05,
  hapticLeast: 0.3,
};

export type TableId = keyof typeof POOL.tables;
export type Table = (typeof POOL.tables)[TableId];
