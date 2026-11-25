import { FEELS, type Feel } from '../config/feels';
import { TUNING } from '../config/tuning';
import type { Box } from './types';
import {
  advance,
  beginHold,
  createWorld,
  feelOf,
  heldBubbles,
  finishFlick,
  finishTap,
  moveHold,
  radiusAt,
  release,
  beginSweep,
  endSweep,
  swipeOf,
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

/** Swipes along an arc that bends by `bend` radians in 0.2 s, then lets go. */
const swipe = (bend: number, wait = 0, speed = 3) => {
  const w = createWorld();
  beginHold(w, box, 0, 0, 'soap');
  let x = 0;
  let y = 0;
  let a = 0;
  for (let i = 0; i < 12; i++) {
    a = (bend * i) / 11;
    x += Math.cos(a) * 0.05;
    y += Math.sin(a) * 0.05;
    moveHold(w, x, y);
    run(w, 1 / 60);
  }
  run(w, wait);
  release(w, Math.cos(a) * speed, Math.sin(a) * speed, 1);
  return w;
};

test('a curved swipe spins the bubble and bends its path the same way', () => {
  const spin = (w: ReturnType<typeof createWorld>) => w.bubbles[0]!.spin;
  expect(spin(swipe(0))).toBe(0);
  expect(spin(swipe(1.2))).toBeGreaterThan(1);
  expect(spin(swipe(-1.2))).toBeCloseTo(-spin(swipe(1.2)));
  expect(spin(swipe(1.2, 0.5))).toBe(0);
  expect(spin(swipe(1.2, 0, 0))).toBeCloseTo(0);

  for (const side of [1, -1]) {
    const w = swipe(1.2 * side);
    const b = w.bubbles[0]!;
    const before = { x: b.v.x, y: b.v.y };
    run(w, 0.15, FEELS.weightless);
    expect(Math.sign(before.x * b.v.y - before.y * b.v.x)).toBe(side);
    expect(Math.sign(b.turn)).toBe(side);
  }
});

test('turning round sharply is not a curve', () => {
  const w = createWorld();
  beginHold(w, box, 0, 0, 'soap');
  for (const x of [0.1, 0.2, 0.3, 0.2, 0.1, 0]) {
    moveHold(w, x, 0);
    run(w, 1 / 60);
  }
  release(w, -3, 0, 1);
  expect(w.bubbles[0]!.spin).toBeCloseTo(0);
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
  expect(w.holds).toHaveLength(0);
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

test('a two-finger swipe pops what it crosses and takes back what its fingers began', () => {
  const w = createWorld(pools);
  beginHold(w, box, 0, 0, 'soap');
  run(w, 1);
  release(w, 0, 0, 1);
  run(w, 0.5);
  beginHold(w, box, 0.8, 1.8, 'soap');
  run(w, 0.05);
  expect(beginSweep(w)).toHaveLength(0);
  beginHold(w, box, 0.6, 1.8, 'soap', false, 1);
  moveHold(w, 0.8, 1.6);
  expect(beginSweep(w)).toHaveLength(0);
  moveHold(w, 0.6, 1.6, 1);
  expect(beginSweep(w)).toHaveLength(2);
  expect(w.holds).toHaveLength(0);
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

test('each finger grows and launches its own bubble', () => {
  const w = createWorld();
  beginHold(w, box, -0.5, 0, 'soap', false, 3);
  run(w, 0.5);
  beginHold(w, box, 0.5, 0, 'ink', false, 7);
  run(w, 0.5);
  expect(w.holds[0]!.bubble.r).toBeGreaterThan(w.holds[1]!.bubble.r);
  // Fingers that have lingered do not sweep.
  moveHold(w, -0.5, 0.5, 3);
  moveHold(w, 0.5, 0.5, 7);
  expect(beginSweep(w)).toHaveLength(0);
  release(w, 0, 0, 1, 3);
  expect(w.bubbles.map((b) => b.style)).toEqual(['soap']);
  expect(w.holds.map((h) => h.finger)).toEqual([7]);
});

test('a finger already growing a bubble keeps it through a sweep by two others', () => {
  const w = createWorld();
  beginHold(w, box, 0, 1.5, 'soap', false, 0);
  run(w, 1);
  beginHold(w, box, -0.5, 0, 'soap', false, 1);
  beginHold(w, box, 0.5, 0, 'soap', false, 2);
  moveHold(w, -0.5, -0.3, 1);
  moveHold(w, 0.5, -0.3, 2);
  expect(beginSweep(w).map((h) => h.finger)).toEqual([1, 2]);
  expect(w.holds.map((h) => h.finger)).toEqual([0]);
  release(w, 0, 0, 1);
  expect(sweepAlong(w, box, 0, 1, 0, 2)).toBe(0);
});

test('bubbles grown side by side press apart and stay in the box', () => {
  const w = createWorld();
  for (const [i, x] of [-0.1, 0, 0.1, 0.95].entries()) beginHold(w, box, x, 0, 'soap', false, i);
  run(w, 4);
  const [a, , c] = w.holds.map((h) => h.bubble);
  expect(c!.p.x - a!.p.x).toBeGreaterThan(0.2);
  for (const { bubble: b } of w.holds) {
    expect(Math.abs(b.p.x) + b.r).toBeLessThanOrEqual(1 + 1e-9);
    expect(Math.abs(b.p.y) + b.r).toBeLessThanOrEqual(2.17 + 1e-9);
  }
});

/** A touch at (x, y) that travels right for `frames`, after resting for `wait`. */
const flick = (
  w: ReturnType<typeof createWorld>,
  { y = 0, wait = 0, frames = 6, style = 'ink', pops = false } = {},
) => {
  beginHold(w, box, 0, y, style, pops);
  run(w, wait);
  for (let i = 1; i <= frames; i++) {
    run(w, 1 / 60);
    moveHold(w, i * 0.05, y);
  }
  return finishFlick(w, box, [FEELS.drift]);
};

test('a quick swipe from a bubble nudges it and makes no new one', () => {
  for (const pops of [false, true]) {
    const w = launch(1);
    run(w, 0.3);
    expect(flick(w, { pops })).toBe(true);
    expect(w.holds).toHaveLength(0);
    expect(w.bubbles).toHaveLength(1);
    expect(w.bubbles[0]!.v.x).toBeGreaterThan(0.5);
  }
});

test('lingering, long or slow swipes and swipes from empty space still make a bubble', () => {
  const ready = () => {
    const w = launch(1);
    run(w, 0.3);
    return w;
  };
  expect(flick(ready(), { wait: 0.3 })).toBe(false);
  expect(flick(ready(), { frames: 30 })).toBe(false);
  expect(flick(ready(), { frames: 1 })).toBe(false);
  expect(flick(ready(), { y: 1.8 })).toBe(false);
  const w = ready();
  expect(flick(w, { wait: 0.3 })).toBe(false);
  release(w, 0, 0, 1);
  expect(w.bubbles).toHaveLength(2);
});

test('a flick that rests before lifting, or whose bubble has popped, is not a flick', () => {
  const w = launch(1);
  run(w, 0.3);
  beginHold(w, box, 0, 0, 'ink');
  run(w, 1 / 60);
  moveHold(w, 0.2, 0);
  run(w, 0.15);
  expect(finishFlick(w, box, [FEELS.drift])).toBe(false);
  const p = launch(1);
  run(p, 0.3);
  p.bubbles[0]!.popping = 0;
  expect(flick(p)).toBe(false);
});

test('a flick moves a large bubble less, and catching an edge spins it', () => {
  const large = launch(3);
  const small = launch(0.3);
  for (const w of [large, small]) {
    run(w, 0.2);
    expect(flick(w)).toBe(true);
  }
  // Compared at one depth, since deeper bubbles travel further to keep pace on the screen.
  const pace = (w: ReturnType<typeof createWorld>) =>
    (w.bubbles[0]!.v.x * box.focal) / (box.focal + w.bubbles[0]!.p.z);
  expect(pace(small)).toBeGreaterThan(pace(large));
  expect(Math.abs(large.bubbles[0]!.spin)).toBeLessThan(0.3);
  for (const side of [1, -1]) {
    const w = launch(3);
    run(w, 0.2);
    expect(flick(w, { y: 0.3 * side })).toBe(true);
    // Pushed right above its centre, it turns clockwise.
    expect(Math.sign(w.bubbles[0]!.spin)).toBe(-side);
  }
});

test('a touch on a bubble soon grows its own if it stays', () => {
  const w = launch(1);
  run(w, 0.3);
  beginHold(w, box, 0, 0, 'ink');
  expect(heldBubbles(w)).toHaveLength(0);
  run(w, TUNING.flick.decide + 0.05);
  expect(heldBubbles(w)).toHaveLength(1);
});

test('swipe speed follows the finger and fades when it rests', () => {
  const w = createWorld();
  beginHold(w, box, 0, 0, 'soap');
  for (let i = 1; i <= 12; i++) {
    run(w, 1 / 60);
    moveHold(w, i * 0.05, 0);
  }
  expect(swipeOf(w.holds[0]!).x).toBeCloseTo(3, 0);
  run(w, 0.3);
  expect(swipeOf(w.holds[0]!)).toEqual({ x: 0, y: 0 });
});
