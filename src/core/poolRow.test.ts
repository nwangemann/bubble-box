import { POOL } from '../config/pool';
import { filled, landsAt, motePath, poolRow, potEnds, potLight } from './poolRow';

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
