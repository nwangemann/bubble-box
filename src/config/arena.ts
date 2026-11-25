/** The showdown's box: the Lattice of the core app. Colours come from the theme. */
export const ARENA = {
  edgeOpacity: 0.34,
  grid: 6,
  gridOpacity: 0.13,
  faceOpacity: 0.015,
  wallOpacity: 1,
  softness: 0,
  /** How plainly the mural shows on the back wall, and its horizon: 1 is the floor, 0 the middle. */
  mural: 0.16,
  horizon: 0.8,
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
