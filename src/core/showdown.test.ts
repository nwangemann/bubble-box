import { ARENA_FEEL } from '../config/feels';
import { ENTRANTS, RULES, type Rule } from '../config/rules';
import { TUNING } from '../config/tuning';
import { paceOf, standing } from './duel';
import { createShowdown } from './showdown';
import type { Box } from './types';
import { advance } from './world';

const S = TUNING.showdown;
const N = ENTRANTS.most;
const phone: Box = { hw: 1, hh: 2.17, depth: S.depth, focal: 3.2 };
const tablet: Box = { ...phone, hh: 1.33 };
const tick = (w: ReturnType<typeof createShowdown>, box = phone) =>
  advance(w, box, [ARENA_FEEL], 1, 1 / 60);
/** Fights to the end. Returns the world and how long it took. */
const fight = (box = phone, rule: Rule = RULES.even) => {
  const w = createShowdown(box, rule, N);
  let t = 0;
  while (w.duel!.phase !== 'won' && t < 120) {
    tick(w, box);
    t += 1 / 60;
  }
  return { w, t };
};
let seed = 1;
beforeEach(() => {
  seed = 1;
  jest.spyOn(Math, 'random').mockImplementation(() => {
    // A plain repeatable generator.
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  });
});
afterEach(() => jest.restoreAllMocks());

test.each([
  ['phone', phone],
  ['tablet', tablet],
])('lines up without touching on a %s', (_, box) => {
  const { bubbles } = createShowdown(box, RULES.even, N);
  expect(new Set(bubbles.map((b) => b.style)).size).toBe(N);
  bubbles.forEach((a, i) =>
    bubbles.slice(i + 1).forEach((b) => {
      expect(Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y, a.p.z - b.p.z)).toBeGreaterThan(a.r + b.r);
    }),
  );
});

test('any number can enter, each once, lined up without touching', () => {
  for (const box of [phone, tablet])
    for (let n = ENTRANTS.least; n <= ENTRANTS.most; n++) {
      const { bubbles, duel } = createShowdown(box, RULES.even, n, N);
      expect(bubbles).toHaveLength(n);
      expect(new Set(duel!.entrants).size).toBe(n);
      bubbles.forEach((a, i) => {
        expect(a.style).toBe(`${duel!.entrants[a.id - 1]}`);
        expect(Math.abs(a.p.x) + a.r).toBeLessThan(box.hw);
        bubbles.slice(i + 1).forEach((b) => {
          const apart = Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y, a.p.z - b.p.z);
          expect(apart).toBeGreaterThan(a.r + b.r);
        });
      });
    }
});

test('nobody is knocked out before the start', () => {
  const w = createShowdown(phone, RULES.even, N);
  for (let t = 0; t < S.ready - 0.1; t += 1 / 60) tick(w);
  expect(w.duel!.phase).toBe('ready');
  expect(standing(w)).toHaveLength(N);
});

test.each(Object.entries(RULES))(
  'every %s showdown ends with one left, at a watchable length',
  (_, rule) => {
    const times: number[] = [];
    for (const box of [phone, tablet])
      for (let i = 0; i < 20; i++) {
        const { w, t } = fight(box, rule);
        expect(w.duel!.phase).toBe('won');
        expect(standing(w).map((b) => b.id)).toEqual([w.duel!.champion]);
        expect(w.duel!.out).toBe(N - 1);
        const wins = Object.values(w.duel!.wins).reduce((a, b) => a + b, 0);
        expect(wins).toBe(N - 1);
        times.push(t - S.ready);
      }
    expect(Math.min(...times)).toBeGreaterThan(4);
    expect(Math.max(...times)).toBeLessThan(45);
  },
);

test('either side of a clash is as likely to win', () => {
  let first = 0;
  const n = 2000;
  for (let i = 0; i < n; i++) {
    const w = createShowdown(phone, RULES.even, N);
    w.duel!.phase = 'fight';
    w.bubbles = w.bubbles.slice(0, 2);
    const [a, b] = w.bubbles as [(typeof w.bubbles)[0], (typeof w.bubbles)[0]];
    a.p = { x: -0.2, y: 0, z: 1 };
    b.p = { x: 0.2, y: 0, z: 1 };
    const id = a.id;
    tick(w);
    expect(w.duel!.out).toBe(1);
    if (w.duel!.clashes[0]!.winner === id) first++;
  }
  expect(Math.abs(first / n - 0.5)).toBeLessThan(0.04);
});

test('a bubble knocked out cannot knock out another in the same moment', () => {
  for (let i = 0; i < 50; i++) {
    const w = createShowdown(phone, RULES.even, N);
    w.duel!.phase = 'fight';
    w.bubbles = w.bubbles.slice(0, 3);
    w.bubbles.forEach((b, k) => (b.p = { x: (k - 1) * 0.3, y: 0, z: 1 }));
    tick(w);
    const out = new Set<number>();
    for (const c of w.duel!.clashes) {
      expect(out.has(c.winner) || out.has(c.loser)).toBe(false);
      out.add(c.loser);
    }
    expect(standing(w).length).toBeGreaterThanOrEqual(1);
  }
});

test('the winner stays, rises to the podium and never pops', () => {
  const { w } = fight();
  for (let i = 0; i < 60 * 20; i++) tick(w);
  const b = w.bubbles.find((o) => o.id === w.duel!.champion)!;
  expect(w.bubbles).toHaveLength(1);
  expect(b.popping).toBeLessThan(0);
  expect(b.r).toBeCloseTo(S.podium.r, 2);
  expect(b.p.x).toBeCloseTo(0, 2);
});

test('time slows for the last pair only', () => {
  const w = createShowdown(phone, RULES.even, N);
  w.duel!.phase = 'fight';
  expect(paceOf(w)).toBe(1);
  w.bubbles = w.bubbles.slice(0, 2);
  w.bubbles[0]!.p = { x: 0, y: 0, z: 1 };
  w.bubbles[1]!.p = { x: 0.52, y: 0, z: 1 };
  expect(paceOf(w)).toBeLessThan(0.5);
});

/** Two entrants of these sizes touch; returns the share `a` wins and the last winner. */
const clash = (rule: Rule, ra: number, rb: number, n = 2000) => {
  let won = 0;
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = createShowdown(phone, rule, N);
    w.duel!.phase = 'fight';
    w.bubbles = w.bubbles.slice(0, 2);
    const [a, b] = w.bubbles as [(typeof w.bubbles)[0], (typeof w.bubbles)[0]];
    a.r = ra;
    b.r = rb;
    a.p = { x: -0.2, y: 0, z: 1 };
    b.p = { x: 0.2, y: 0, z: 1 };
    const id = a.id;
    tick(w);
    if (w.duel!.clashes[0]!.winner === id) won++;
    last = w.duel!.sizes[w.duel!.clashes[0]!.winner] ?? 0;
  }
  return { share: won / n, size: last };
};

test('when winners grow, the larger is likelier to win and equals are even', () => {
  expect(Math.abs(clash(RULES.grow, 0.25, 0.25).share - 0.5)).toBeLessThan(0.04);
  // Both already grown, and matching.
  expect(Math.abs(clash(RULES.grow, 0.4, 0.4).share - 0.5)).toBeLessThan(0.04);
  const slight = clash(RULES.grow, 0.3, 0.25).share;
  const large = clash(RULES.grow, 0.5, 0.25).share;
  expect(slight).toBeGreaterThan(0.56);
  expect(large).toBeGreaterThan(slight);
  // An upset stays possible.
  expect(large).toBeLessThan(0.95);
  expect(clash(RULES.grow, 0.25, 0.5).share).toBeCloseTo(1 - large, 1);
  // Under even odds size changes nothing, and nobody grows.
  const even = clash(RULES.even, 0.5, 0.25);
  expect(Math.abs(even.share - 0.5)).toBeLessThan(0.04);
  expect([0.25, 0.5]).toContain(even.size);
});

test('a winner takes in its share of the loser and ends up big', () => {
  const r = S.radius;
  const { size } = clash(RULES.grow, r, r, 1);
  expect(size ** 3).toBeCloseTo(r ** 3 * (1 + RULES.grow.absorb));
  const { w } = fight(phone, RULES.grow);
  const before = w.bubbles.find((b) => b.id === w.duel!.champion)!;
  expect(w.duel!.sizes[before.id]).toBeGreaterThan(r * 1.7);
  for (let i = 0; i < 600; i++) tick(w);
  expect(before.r).toBeGreaterThan(S.podium.r * 1.2);
});

test('everyone starts the same size, and looks it', () => {
  for (const rule of Object.values(RULES)) {
    const { bubbles } = createShowdown(phone, rule, N);
    expect(new Set(bubbles.map((b) => b.r))).toEqual(new Set([S.radius]));
    expect(new Set(bubbles.map((b) => b.p.z)).size).toBe(1);
  }
});

/** Two entrants about to touch, drifting. */
const pair = (rule: Rule) => {
  const w = createShowdown(phone, rule, 2);
  w.duel!.phase = 'fight';
  const [a, b] = w.bubbles as [(typeof w.bubbles)[0], (typeof w.bubbles)[0]];
  a.p = { x: -0.22, y: 0, z: 1.2 };
  b.p = { x: 0.22, y: 0.1, z: 1.2 };
  a.v = { x: 0.5, y: 0.2, z: 0 };
  b.v = { x: -0.1, y: 0, z: 0 };
  return w;
};

test('draining across moves volume smoothly and loses only the spray', () => {
  const w = pair(RULES.grow);
  let last = 0;
  for (let i = 0; i < 90; i++) {
    tick(w);
    const win = w.bubbles.find((b) => !b.join && b.popping < 0)!;
    if (last) expect(win.r - last).toBeLessThan(0.02);
    expect(win.r).toBeGreaterThanOrEqual(last);
    last = win.r;
    if (w.duel!.phase === 'won' && w.bubbles.length === 1) break;
  }
  expect(w.bubbles).toHaveLength(1);
  expect(last ** 3).toBeCloseTo(S.radius ** 3 * (1 + RULES.grow.absorb), 3);
});

test('the surface rings after coalescing, then settles', () => {
  const w = pair(RULES.grow);
  let most = 0;
  let turns = 0;
  let sign = 0;
  for (let i = 0; i < 60 * 12; i++) {
    tick(w);
    const o = w.duel!.ringing[w.duel!.champion];
    if (!o) continue;
    most = Math.max(most, Math.abs(o.a2));
    if (sign && Math.sign(o.a2) !== sign) turns++;
    sign = Math.sign(o.a2);
    expect(Math.hypot(o.n.x, o.n.y, o.n.z)).toBeCloseTo(1);
  }
  expect(most).toBeGreaterThan(0.05);
  expect(turns).toBeGreaterThan(3);
  expect(Math.abs(w.duel!.ringing[w.duel!.champion]!.a2)).toBeLessThan(0.02);
});

test('a bubble can lose while still taking another in, and nothing is stranded', () => {
  for (let i = 0; i < 30; i++) {
    const w = createShowdown(phone, RULES.grow, 3);
    w.duel!.phase = 'fight';
    w.bubbles.forEach((b, k) => (b.p = { x: (k - 1) * 0.46, y: 0, z: 1.2 }));
    for (let t = 0; t < 60 * 20; t++) tick(w);
    expect(w.bubbles).toHaveLength(1);
    expect(w.bubbles[0]!.id).toBe(w.duel!.champion);
  }
});
