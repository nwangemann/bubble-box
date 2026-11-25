import { POOL } from '../config/pool';

/** A ball's place among potted and remaining: its place in `balls`, and pixels from the middle. */
export type RowPlace = { ball: number; x: number };
export type RowGroup = { kind: 'solid' | 'eight' | 'stripe'; places: RowPlace[] };
export type PoolRowLayout = { groups: RowGroup[]; radius: number };

/** Solids, the 8, then stripes: three groups, so each can be given to a player. Shrinks to fit. */
export function poolRow(width: number): PoolRowLayout {
  'worklet';
  const { gap, apart, side, radius } = POOL.row;
  const kinds = ['solid', 'eight', 'stripe'] as const;
  const groups: RowGroup[] = kinds.map((kind) => {
    const places: RowPlace[] = [];
    POOL.looks.forEach((look, ball) => {
      if (look.kind === kind) places.push({ ball, x: 0 });
    });
    return { kind, places };
  });
  const count = groups.reduce((n, g) => n + g.places.length, 0);
  const span = (count - 1) * gap + (groups.length - 1) * apart;
  const fit = Math.min(1, (width - 2 * side) / (span + 2 * radius));
  let x = (-span / 2) * fit;
  for (const g of groups) {
    for (const place of g.places) {
      place.x = x;
      x += gap * fit;
    }
    x += apart * fit;
  }
  return { groups, radius: radius * fit };
}

/** Seconds from dropping to when a ball starts to fill its place: with Reduce Motion nothing flies. */
export function landsAt(calm: boolean) {
  'worklet';
  return calm ? POOL.sink : POOL.pot.lands;
}

/** Seconds from dropping until nothing of a pot is left to draw. */
export function potEnds(calm: boolean) {
  'worklet';
  const { gone, blooms } = POOL.pot;
  return Math.max(gone, landsAt(calm) + Math.max(blooms, POOL.row.fill));
}

/** How far a ball has filled its place, 0 to 1, by its `sunk`. */
export function filled(sunk: number, calm: boolean) {
  'worklet';
  const k = Math.max(0, Math.min(1, (sunk - landsAt(calm)) / POOL.row.fill));
  return k * k * (3 - 2 * k);
}

/** The light of a pot, 0 to 1, by its ball's `sunk`: up quickly, then slowly away. */
export function potLight(sunk: number) {
  'worklet';
  const { rise, gone } = POOL.pot;
  if (sunk < 0 || sunk >= gone) return 0;
  if (sunk < rise) return (sunk / rise) * (2 - sunk / rise);
  const k = 1 - (sunk - rise) / (gone - rise);
  return k * k;
}

/** Where a mote is between two places at `k`, 0 to 1 of its way, bowed towards the middle. */
export function motePath(from: number[], to: number[], k: number) {
  'worklet';
  const e = k * k * (3 - 2 * k);
  const bow = 4 * e * (1 - e) * POOL.pot.mote.bow;
  const x = from[0]! + (to[0]! - from[0]!) * e;
  return { x: x - from[0]! * bow, y: from[1]! + (to[1]! - from[1]!) * e };
}
