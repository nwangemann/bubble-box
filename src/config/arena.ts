/** The showdown's box: the Lattice of the core app. Colours come from the theme. */
export const ARENA = {
  edgeOpacity: 0.34,
  grid: 6,
  gridOpacity: 0.13,
  faceOpacity: 0.015,
  wallOpacity: 1,
  softness: 0,
  /** How plainly the mural shows on the back wall, and its horizon: 1 is the floor, 0 the middle. */
  mural: 0.3,
  horizon: 0.8,
  /** How far the mural takes on the colours of a thin film. */
  sheen: 0.22,
};

/**
 * How distance changes a showdown bubble. Clear up to `from`, a share of the arena's depth; the rest
 * are its amounts at the back wall. Haze is towards the arena's own light. Blur is in radii of the
 * bubble for the film, of the figure for the figure.
 */
export const AIR = {
  from: 0.3,
  haze: 0.5,
  dim: 0.35,
  film: 0.1,
  figure: 0.12,
};

/**
 * How a showdown bubble shows on the room around it. All but ripples die away by `fall` radii of gap
 * between bubble and wall. Shadows: `shadow` beneath it on the floor, widening by `spread` of the gap,
 * and `touch` on any wall it presses against. `light` is its own colour thrown on a wall, `focus` what
 * it gathers in the middle of its shadow, `mirror` its reflection. `ripple` is the rings where it hits.
 */
export const ROOM_CONTACT = {
  fall: 2.6,
  shadow: 0.7,
  spread: 0.35,
  touch: 0.45,
  light: 0.34,
  focus: 0.16,
  mirror: 0.42,
  ripple: 0.8,
};

/**
 * The light round a favourite: its colour, and when it rages. `reach` is how far it spreads, in radii;
 * strengths are 0 to 1. Fallen, it opens and rises; on the winner, `waves` of it spread each `period`.
 */
export const HALO = {
  warm: [255, 214, 150],
  hot: [255, 96, 62],
  reach: 1.75,
  fight: 0.6,
  roster: 0.8,
  gone: 0.25,
  fall: { strength: 0.7, open: 1.2, rise: 0.16 },
  win: { strength: 0.35, open: 0.9, waves: 3, period: 6 },
};
