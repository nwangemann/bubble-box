import { POOL } from '../config/pool';
import { createGame } from './poolGame';
import {
  createRowTurn,
  filled,
  followGame,
  landsAt,
  motePath,
  placeAt,
  poolRow,
  potEnds,
  potLight,
  turnMark,
} from './poolRow';

test('every ball to pot has its own place, in three groups and the same colour order', () => {
  const { groups } = poolRow(402);
  expect(groups.map((g) => [g.kind, g.places.length])).toEqual([
    ['solid', 7],
    ['eight', 1],
    ['stripe', 7],
  ]);
  const all = groups.flatMap((g) => g.places.map((p) => p.ball));
  expect([...all].sort((a, b) => a - b)).toEqual(POOL.looks.map((_, i) => i).slice(1));
  const colors = (n: number) => groups[n]!.places.map((p) => POOL.looks[p.ball]!.color);
  expect(colors(0)).toEqual(colors(2));
});

test('the row is centred, fits a narrow phone and never overlaps', () => {
  for (const width of [320, 375, 402, 440]) {
    const { groups, radius } = poolRow(width);
    const xs = groups.flatMap((g) => g.places.map((p) => p.x));
    expect(xs[0]!).toBeCloseTo(-xs[14]!);
    expect(xs[7]!).toBeCloseTo(0);
    expect(xs[14]! + radius).toBeLessThanOrEqual(width / 2 - POOL.row.side + 1e-9);
    for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeGreaterThan(2 * radius);
  }
});

test('a place fills only once its ball has sunk', () => {
  for (const calm of [false, true]) {
    expect(filled(-1, calm)).toBe(0);
    expect(filled(landsAt(calm), calm)).toBe(0);
    expect(filled(landsAt(calm) + POOL.row.fill, calm)).toBe(1);
  }
  // What is drawn sinking is gone before it fills.
  expect(landsAt(false)).toBeGreaterThanOrEqual(POOL.sink);
});

test('a pot is over before a cleared table is set again', () => {
  expect(potEnds(false)).toBeLessThan(POOL.sink + POOL.again);
  expect(potEnds(true)).toBeLessThanOrEqual(potEnds(false));
});

test('the light of a pot eases up, away, and stays away', () => {
  expect(potLight(-1)).toBe(0);
  expect(potLight(0)).toBe(0);
  expect(potLight(POOL.pot.rise)).toBeCloseTo(1);
  expect(potLight(POOL.pot.gone - 1e-4)).toBeLessThan(1e-3);
  expect(potLight(1e3)).toBe(0);
});

test('a mote goes from its pocket to its place', () => {
  const from = [-70, 160];
  const to = [40, -350];
  expect(motePath(from, to, 0)).toEqual({ x: -70, y: 160 });
  expect(motePath(from, to, 1)).toEqual({ x: 40, y: -350 });
});

test("once the table is taken, each group moves onto the other's places, keeping its colour order", () => {
  const row = poolRow(402);
  const [solids, eight, stripes] = row.groups;
  solids!.places.forEach((place, j) => {
    expect(placeAt(row, 'solid', place.x, 0)).toEqual({ x: place.x, y: 0 });
    const there = placeAt(row, 'solid', place.x, 1);
    expect(there.x).toBeCloseTo(stripes!.places[j]!.x);
    expect(there.y).toBeCloseTo(0);
    expect(placeAt(row, 'stripe', stripes!.places[j]!.x, 1).x).toBeCloseTo(place.x);
  });
  expect(placeAt(row, 'eight', eight!.places[0]!.x, 0.5)).toEqual({ x: 0, y: 0 });
  // Halfway, solids pass below and stripes above, clear of each other.
  const low = placeAt(row, 'solid', solids!.places[6]!.x, 0.5);
  const high = placeAt(row, 'stripe', stripes!.places[0]!.x, 0.5);
  expect(low.y - high.y).toBeGreaterThan(2 * row.radius);
  // And clear of the 8, which stays.
  expect(Math.min(low.y, -high.y)).toBeGreaterThan(2 * row.radius);
});

test("the turn's line lies under the shooter's half, clear of the 8 and within the row", () => {
  for (const width of [320, 402]) {
    const row = poolRow(width);
    const left = turnMark(row, 0);
    const right = turnMark(row, 1);
    expect(left.x).toBeCloseTo(-right.x);
    expect(left.x + left.half).toBeLessThan(-row.radius);
    expect(left.x - left.half).toBeCloseTo(-row.end);
    expect(row.end).toBeLessThanOrEqual(width / 2 - POOL.row.side + 1e-9);
  }
});

test('the row follows the game: whose turn, whose groups, and a second shot, eased or at once', () => {
  const game = createGame();
  const t = createRowTurn();
  expect(followGame(t, game, 1 / 60, false)).toBe(false);
  game.turn = 1;
  game.shots = 2;
  game.groups = ['stripe', 'solid'];
  expect(followGame(t, game, 1 / 60, false)).toBe(true);
  expect(t.side).toBeGreaterThan(0);
  expect(t.side).toBeLessThan(1);
  expect(t.swap).toBeLessThan(t.side);
  for (let i = 0; i < 120; i++) followGame(t, game, 1 / 60, false);
  expect(t).toEqual({ side: 1, swap: 1, second: 1 });
  expect(followGame(t, game, 1 / 60, false)).toBe(false);
  // A new rack opens the table: back where they began. With Reduce Motion, at once.
  game.groups = null;
  game.shots = 1;
  game.turn = 0;
  expect(followGame(t, game, 1 / 60, true)).toBe(true);
  expect(t).toEqual({ side: 0, swap: 0, second: 0 });
});
