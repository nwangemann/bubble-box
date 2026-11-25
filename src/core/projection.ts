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
