import { POOL } from '../config/pool';
import type { Group, PoolGame } from './poolGame';

/** A ball's place among potted and remaining: its place in `balls`, and pixels from the middle. */
export type RowPlace = { ball: number; x: number };
export type RowGroup = { kind: 'solid' | 'eight' | 'stripe'; places: RowPlace[] };
/** `shift` carries the solids onto the stripes' places; `end` is the outer edge of each half. */
export type PoolRowLayout = { groups: RowGroup[]; radius: number; shift: number; end: number };

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
  const first = (g: RowGroup) => g.places[0]!.x;
  return {
    groups,
    radius: radius * fit,
    shift: first(groups[2]!) - first(groups[0]!),
    end: (span / 2) * fit + radius * fit,
  };
}

/**
 * Whose the row shows, eased: `side` 0 for player 1, 1 for player 2; `swap` 1 once the stripes are
 * player 1's; `second` 1 while the shooter has two shots. Each goes linearly; drawn eased.
 */
export type RowTurn = { side: number; swap: number; second: number };

export function createRowTurn(): RowTurn {
  'worklet';
  return { side: 0, swap: 0, second: 0 };
}

/** Moves `from` towards `to` by `step`, at most. */
function towards(from: number, to: number, step: number) {
  'worklet';
  return from < to ? Math.min(to, from + step) : Math.max(to, from - step);
}

/** Follows the game by `dt` seconds, or at once with Reduce Motion. Whether anything moved. */
export function followGame(t: RowTurn, game: PoolGame, dt: number, calm: boolean) {
  'worklet';
  const { swap, turn } = POOL.row;
  const side = game.turn;
  const swapped = game.groups && game.groups[0] === 'stripe' ? 1 : 0;
  const second = game.shots > 1 ? 1 : 0;
  const was = t.side + t.swap + t.second;
  const quick = calm ? 1 : dt / turn.seconds;
  t.side = towards(t.side, side, quick);
  t.second = towards(t.second, second, quick);
  t.swap = towards(t.swap, swapped, calm ? 1 : dt / swap.seconds);
  return t.side + t.swap + t.second !== was;
}

/** Eased in and out. */
export function smooth(k: number) {
  'worklet';
  return k * k * (3 - 2 * k);
}

/** Where a place is drawn, from the middle of the row, with the groups `swap`ped by 0 to 1. */
export function placeAt(row: PoolRowLayout, kind: Group | 'eight', x: number, swap: number) {
  'worklet';
  if (kind === 'eight') return { x, y: 0 };
  const e = smooth(swap);
  const way = kind === 'solid' ? 1 : -1;
  // Solids pass below and stripes above, so neither crosses the other.
  return { x: x + way * row.shift * e, y: way * 4 * e * (1 - e) * POOL.row.swap.bow };
}

/** The line under the shooter's half: its middle and half length from the row's middle, eased. */
export function turnMark(row: PoolRowLayout, side: number) {
  'worklet';
  const inner = row.radius * POOL.row.turn.inner;
  const e = smooth(side);
  const middle = ((row.end + inner) / 2) * (2 * e - 1);
  // Shortens as it passes under the 8.
  const half = ((row.end - inner) / 2) * (1 - 0.6 * 4 * e * (1 - e));
  return { x: middle, half };
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
