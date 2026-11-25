import { FEELS, type Feel } from '../config/feels';
import { TUNING } from '../config/tuning';
import type { Box } from './types';
import {
  advance,
  beginHold,
  createWorld,
  feelOf,
  finishTap,
  radiusAt,
  release,
  beginSweep,
  endSweep,
  sweepAlong,
} from './world';

const box: Box = { hw: 1, hh: 2.17, depth: 5, focal: 3.2 };
const run = (w: ReturnType<typeof createWorld>, s: number, feel: Feel = FEELS.drift) => {
  for (let i = 0; i < s * 60; i++) advance(w, box, [feel], 1, 1 / 60);
};
const launch = (hold: number, sx = 0, sy = 0) => {
  const w = createWorld();
  beginHold(w, box, 0, 0, 'soap');
  run(w, hold);
  release(w, sx, sy, 1);
  return w;
};

test('keeps growing while held, ever more slowly', () => {
  const g = [0, 1, 2, 3].map(radiusAt) as [number, number, number, number];
  expect(g[1] - g[0]).toBeGreaterThan(g[2] - g[1]);
  expect(g[3]).toBeGreaterThan(g[2]);
});

test('flies away, hits the back wall and returns to the glass', () => {
  const w = launch(1);
  const b = w.bubbles[0]!;
  let far = 0;
  let returned = false;
  for (let i = 0; i < 1200; i++) {
    advance(w, box, [FEELS.weightless], 1, 1 / 60);
    far = Math.max(far, b.p.z);
    if (far > 4 && b.p.z < b.r + 0.02) returned = true;
  }
  expect(far + b.r).toBeGreaterThan(box.depth - 0.05);
  expect(returned).toBe(true);
});

test('a longer hold launches harder and a swipe steers', () => {
  expect(launch(3).bubbles[0]!.v.z).toBeGreaterThan(launch(0.2).bubbles[0]!.v.z);
  expect(launch(0.5, 4, 0).bubbles[0]!.v.x).toBeGreaterThan(0.5);
});

test.each(Object.entries(FEELS))('%s keeps a crowd finite and inside the box', (_, feel) => {
  const w = createWorld();
  for (let i = 0; i < 14; i++) {
    beginHold(w, box, Math.sin(i) * 0.9, Math.cos(i * 3) * 2, 'soap');
    run(w, 0.2 + (i % 4) * 0.7, feel);
    release(w, Math.sin(i * 5) * 40, Math.cos(i * 7) * 40, feel.speed);
  }
  run(w, 30, feel);
  expect(w.bubbles.length).toBe(TUNING.maxBubbles);
  for (const b of w.bubbles) {
    for (const [a, lo, hi] of [
      ['x', -1, 1],
      ['y', -2.17, 2.17],
      ['z', 0, 5],
    ] as const) {
      expect(b.p[a] - b.r).toBeGreaterThanOrEqual(lo - 1e-9);
      expect(b.p[a] + b.r).toBeLessThanOrEqual(hi + 1e-9);
    }
  }
});

test('only a hit on the glass starts a wave, which then fades', () => {
  const w = launch(0.5);
  let sawBack = false;
  let sawGlass = false;
  for (let i = 0; i < 1200 && !sawGlass; i++) {
    advance(w, box, [FEELS.weightless], 1, 1 / 60);
    if (w.ripples.some((r) => r.p.z === box.depth)) sawBack = true;
    sawGlass = w.waves.length > 0;
    if (!sawGlass) continue;
    expect(sawBack).toBe(true);
  }
  expect(sawGlass).toBe(true);
  w.bubbles = [];
  run(w, TUNING.glass.seconds + 0.1);
  expect(w.waves).toHaveLength(0);
});

test('a quick tap pops the bubble under it; holding there grows a new one', () => {
  const w = launch(1);
  run(w, 0.3);
  beginHold(w, box, 0, 0, 'soap', true);
  run(w, 0.1);
  expect(finishTap(w)).toBe(true);
  expect(w.held).toBeNull();
  run(w, 1);
  expect(w.bubbles).toHaveLength(0);

  const h = launch(1);
  run(h, 0.3);
  beginHold(h, box, 0, 0, 'soap', true);
  run(h, 0.6);
  expect(finishTap(h)).toBe(false);
  release(h, 0, 0, 1);
  expect(h.bubbles).toHaveLength(2);
});

const pools = {
  meet: ['sparks'],
  pop: ['brood'],
  lives: { sparks: 1.5, brood: 0.9 },
  pieces: { brood: 5 },
};

test('bubbles that meet throw one burst per contact', () => {
  const w = createWorld(pools);
  beginHold(w, box, 0, 0, 'soap');
  run(w, 0.6);
  release(w, 0, 0, 1);
  beginHold(w, box, 0, 0, 'ink');
  run(w, 0.6);
  release(w, 0, 0, 1);
  let seen = 0;
  for (let i = 0; i < 600 && seen === 0; i++) {
    advance(w, box, [FEELS.weightless], 1, 1 / 60);
    seen = w.bursts.length;
  }
  expect(seen).toBe(1);
  expect(Math.hypot(...Object.values(w.bursts[0]!.n))).toBeCloseTo(1);
  w.bubbles = [];
  run(w, 2);
  expect(w.bursts).toHaveLength(0);
});

test('a tapped bubble can break into pieces, small ones cannot', () => {
  const w = createWorld(pools);
  beginHold(w, box, 0, 0, 'soap');
  run(w, 1);
  release(w, 0, 0, 1);
  run(w, 0.3);
  beginHold(w, box, 0, 0, 'soap', true);
  expect(finishTap(w)).toBe(true);
  const alive = () => w.bubbles.filter((b) => b.popping < 0);
  expect(alive()).toHaveLength(5);
  run(w, 1);
  for (const b of alive()) b.r = 0.05;
  w.bubbles[0]!.p = { x: 0, y: 0, z: 0.05 };
  beginHold(w, box, 0, 0, 'soap', true);
  expect(finishTap(w)).toBe(true);
  expect(alive()).toHaveLength(4);
});

test('a two-finger swipe pops what it crosses and takes back the first finger', () => {
  const w = createWorld(pools);
  beginHold(w, box, 0, 0, 'soap');
  run(w, 1);
  release(w, 0, 0, 1);
  run(w, 0.5);
  beginHold(w, box, 0.8, 1.8, 'soap');
  run(w, 0.05);
  beginSweep(w);
  expect(w.held).toBeNull();
  expect(sweepAlong(w, box, 0, 0, 0.01, 0)).toBe(0);
  expect(sweepAlong(w, box, -0.9, 1.9, -0.9, 1.5)).toBe(0);
  expect(sweepAlong(w, box, -0.9, 0, 0.9, 0)).toBe(1);
  // Its pieces survive the swipe that made them.
  expect(sweepAlong(w, box, 0.9, 0, -0.9, 0)).toBe(0);
  endSweep(w);
  expect(w.bubbles.filter((b) => b.popping < 0)).toHaveLength(5);
});

test('with several feels, bubbles differ and each keeps its own', () => {
  const feels = Object.values(FEELS);
  const w = createWorld();
  for (let i = 0; i < 8; i++) {
    beginHold(w, box, 0, 0, 'soap');
    release(w, 0, 0, 1);
  }
  const first = w.bubbles.map((b) => feelOf(b, feels));
  expect(new Set(first).size).toBeGreaterThan(2);
  for (let i = 0; i < 60; i++) advance(w, box, feels, 1, 1 / 60);
  expect(w.bubbles.map((b) => feelOf(b, feels))).toEqual(first);
});
