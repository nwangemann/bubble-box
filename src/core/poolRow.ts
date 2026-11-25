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

/** How far a ball has filled its place, 0 to 1, by its `sunk`. */
export function filled(sunk: number) {
  'worklet';
  const k = Math.max(0, Math.min(1, (sunk - POOL.sink) / POOL.row.fill));
  return k * k * (3 - 2 * k);
}
