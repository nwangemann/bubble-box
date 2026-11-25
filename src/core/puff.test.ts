import { FEELS, type Feel } from '../config/feels';
import { TUNING } from '../config/tuning';
import type { Box } from './types';
import { advance, beginHold, createWorld, newBubble, popAll, popApart, takePopped } from './world';

const box: Box = { hw: 1, hh: 2.17, depth: 5, focal: 3.2 };
const still: Feel = { ...FEELS.weightless, minSpeed: 0 };

/** Pops a bubble beside another and lets the air pass. */
const beside = (gap: number, r = 0.2, popped = 0.3, feel = still) => {
  const w = createWorld();
  const a = newBubble(w, 'soap', popped, { x: -0.5, y: 0, z: 2.5 });
  const b = newBubble(w, 'soap', r, { x: -0.5, y: popped + gap + r, z: 2.5 });
  w.bubbles.push(a, b);
  popApart(w, a);
  let jump = 0;
  for (let i = 0; i < 60; i++) {
    const before = b.v.y;
    advance(w, box, [feel], 1, 1 / 60);
    jump = Math.max(jump, b.v.y - before);
  }
  return { w, b, jump };
};

test('a pop pushes what is near straight away from it, easing in', () => {
  const { w, b, jump } = beside(0.1);
  expect(b.v.y).toBeGreaterThan(0.15);
  expect(b.v.x).toBeCloseTo(0);
  expect(jump).toBeLessThan(b.v.y * 0.3);
  expect(w.puffs).toHaveLength(0);
});

test('nearer, smaller and beside a larger pop is pushed more; far is not', () => {
  const v = (...a: Parameters<typeof beside>) => beside(...a).b.v.y;
  expect(v(0.1)).toBeGreaterThan(v(0.4));
  expect(v(0.1, 0.1)).toBeGreaterThan(v(0.1, 0.4));
  expect(v(0.1, 0.2, 0.4)).toBeGreaterThan(v(0.1, 0.2, 0.2));
  expect(v(TUNING.puff.reach + 0.05)).toBe(0);
});

test('many pops never push past the limit, nor speed a faster bubble', () => {
  const w = createWorld();
  const b = newBubble(w, 'soap', 0.1, { x: 0, y: 0, z: 2.5 });
  const fast = newBubble(w, 'soap', 0.1, { x: 0.5, y: 0, z: 0.5 });
  fast.v.z = 3;
  w.bubbles.push(b, fast);
  for (let i = 0; i < 8; i++) {
    const o = newBubble(w, 'soap', 0.5, { x: 0, y: -0.6, z: 2.5 });
    w.bubbles.push(o);
    popApart(w, o);
  }
  for (let i = 0; i < 24; i++) advance(w, box, [still], 1, 1 / 60);
  const limit = TUNING.puff.fastest * still.speed;
  expect(Math.hypot(b.v.x, b.v.y, b.v.z)).toBeLessThanOrEqual(limit + 1e-6);
  expect(Math.hypot(fast.v.x, fast.v.y, fast.v.z)).toBeLessThanOrEqual(3 + 1e-6);
});

test('a held bubble shivers and stays; one born later feels nothing', () => {
  const w = createWorld();
  const a = newBubble(w, 'soap', 0.3, { x: 0.5, y: 0, z: 0.3 });
  w.bubbles.push(a);
  const hold = () => {
    beginHold(w, box, 0, 0, 'soap');
    w.holds[0]!.seconds = 0.5;
    return w.holds[0]!.bubble;
  };
  const b = hold();
  popApart(w, a);
  const c = newBubble(w, 'soap', 0.1, { x: 0.5, y: 0.5, z: 0.3 });
  w.bubbles.push(c);
  let shiver = 0;
  for (let i = 0; i < 30; i++) {
    advance(w, box, [still], 1, 1 / 60);
    shiver = Math.max(shiver, -b.d.x - b.d.z);
  }
  expect(b.p.x).toBeCloseTo(0);
  expect(shiver).toBeGreaterThan(0.005);
  expect(Math.hypot(c.v.x, c.v.y, c.v.z)).toBe(0);
});

test('clearing pushes nothing, and the largest pop is reported once', () => {
  const w = createWorld();
  for (const r of [0.1, 0.3]) w.bubbles.push(newBubble(w, 'soap', r, { x: 0, y: r * 3, z: 2 }));
  popAll(w);
  expect(takePopped(w)).toBe(0.3);
  expect(takePopped(w)).toBe(0);
  advance(w, box, [still], 1, 1 / 60);
  for (const b of w.bubbles) expect(b.v.y).toBe(0);
});
