import { FEELS } from '../config/feels';
import { PULLS, type Pull } from '../config/pulls';
import { RULES } from '../config/rules';
import { TUNING } from '../config/tuning';
import { pairOf } from './pull';
import { createShowdown } from './showdown';
import type { Box } from './types';
import { advance, createWorld, newBubble } from './world';

const box: Box = { hw: 1, hh: 2.17, depth: 5, focal: 3.2 };
/** Wide enough that walls play no part. */
const wide: Box = { ...box, hw: 2 };
const still = { ...FEELS.weightless, minSpeed: 0 };
const run = (w: ReturnType<typeof createWorld>, s: number, feel = still) => {
  for (let i = 0; i < s * 60; i++) advance(w, wide, [feel], 1, 1 / 60);
};
/** Two resting bubbles, `gap` apart. */
const pair = (pulls: Pull[], gap: number, ra = 0.2, rb = 0.2) => {
  const w = createWorld();
  w.pulls = pulls;
  const a = newBubble(w, 'soap', ra, { x: -(gap / 2 + ra), y: 0, z: 2.5 });
  const b = newBubble(w, 'soap', rb, { x: gap / 2 + rb, y: 0, z: 2.5 });
  w.bubbles.push(a, b);
  return { w, a, b };
};

test.each(Object.entries(PULLS))('%s draws two together, harder when nearer', (_, pull) => {
  const speed = (gap: number) => {
    const { w, a } = pair([pull], gap);
    run(w, 0.1);
    return a.v.x;
  };
  expect(speed(pull.reach * 0.2)).toBeGreaterThan(speed(pull.reach * 0.6));
  expect(speed(pull.reach * 0.6)).toBeGreaterThan(0);
  expect(speed(pull.reach * 1.05)).toBe(0);
});

test('without a pull, resting bubbles stay', () => {
  const { w, a } = pair([], 0.1);
  run(w, 1);
  expect(a.v.x).toBe(0);
});

test('the smaller gives more, and momentum is kept', () => {
  const { w, a, b } = pair([PULLS.near], 0.2, 0.3, 0.15);
  run(w, 0.1);
  expect(-b.v.x).toBeGreaterThan(a.v.x * 4);
  expect(a.v.x * a.r ** 3 + b.v.x * b.r ** 3).toBeCloseTo(0, 6);
});

test('size sways only Heavy', () => {
  const gain = (pull: Pull, r: number) => {
    const { w, a } = pair([pull], 0.2, r, r);
    run(w, 0.05);
    return a.v.x;
  };
  expect(gain(PULLS.heavy, 0.36)).toBeGreaterThan(gain(PULLS.heavy, 0.18) * 1.8);
  expect(gain(PULLS.near, 0.36)).toBeCloseTo(gain(PULLS.near, 0.18), 5);
});

test('a path that would miss bends, at the same speed', () => {
  const { w, a, b } = pair([PULLS.near], 0.4);
  a.v = { x: 1, y: 0.8, z: 0 };
  b.v = { x: -1, y: -0.8, z: 0 };
  const before = Math.hypot(1, 0.8);
  const slope = a.v.y / a.v.x;
  run(w, 0.15);
  expect(a.v.y / a.v.x).toBeLessThan(slope);
  expect(Math.hypot(a.v.x, a.v.y)).toBeLessThanOrEqual(before + 1e-9);
});

test('no room speeds up, clumps or keeps a pair circling', () => {
  for (const pull of Object.values(PULLS)) {
    const w = createWorld();
    w.pulls = [pull];
    for (let i = 0; i < 8; i++) {
      const at = { x: (i % 2) - 0.5, y: (i - 3.5) * 0.45, z: 1 + (i % 3) };
      const b = newBubble(w, 'soap', 0.14 + (i % 4) * 0.06, at);
      b.v = { x: 0.3, y: i % 2 ? 0.2 : -0.2, z: 0.25 };
      w.bubbles.push(b);
    }
    let longest = 0;
    const close: Record<number, number> = {};
    for (let t = 0; t < 60 * 60; t++) {
      advance(w, box, [FEELS.drift], 1, 1 / 60);
      w.bubbles.forEach((a, i) =>
        w.bubbles.slice(i + 1).forEach((b) => {
          const gap = Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y, a.p.z - b.p.z) - a.r - b.r;
          const key = pairOf(a, b);
          close[key] = gap < 0.2 ? (close[key] ?? 0) + 1 / 60 : 0;
          longest = Math.max(longest, close[key]);
        }),
      );
    }
    expect(longest).toBeLessThan(10);
    for (const b of w.bubbles) expect(Math.hypot(b.v.x, b.v.y, b.v.z)).toBeLessThan(1.5);
  }
});

test('a pair tires on touching, then forgets', () => {
  const { w, a, b } = pair([PULLS.near], -0.01);
  run(w, 1 / 60);
  expect(w.weary[pairOf(a, b)]).toBeGreaterThan(0.95);
  w.bubbles.pop();
  run(w, TUNING.pull.rest + 0.5);
  expect(w.weary).toEqual({});
});

test('nobody is drawn before a showdown starts', () => {
  const w = createShowdown(box, RULES.grow, 12);
  run(w, 1);
  expect(w.duel!.phase).toBe('ready');
  expect(w.weary).toEqual({});
});
