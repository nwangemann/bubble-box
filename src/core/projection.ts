import type { Box } from './types';

/** Perspective scale at a depth. 1 at the screen. */
export function scaleAt(box: Box, z: number) {
  'worklet';
  return box.focal / (box.focal + z);
}

/** World x or y that appears at screen-plane coordinate `s` when at depth `z`. */
export function unproject(box: Box, s: number, z: number) {
  'worklet';
  return s / scaleAt(box, z);
}

/** How far into the box a depth is: 0 up to the share `from`, 1 at the back wall. */
export function awayAt(box: Box, z: number, from: number) {
  'worklet';
  return Math.max(0, Math.min(1, (z / box.depth - from) / (1 - from)));
}
