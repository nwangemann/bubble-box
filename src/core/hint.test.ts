import { TUNING } from '../config/tuning';
import { advanceHint, createHint, hintPose, learnHint } from './hint';
import type { Box } from './types';
import { beginHold, createWorld, newBubble, popAll } from './world';

const H = TUNING.hint;
const box: Box = { hw: 1, hh: 2.17, depth: 5, focal: 3.2 };
const dt = 1 / 60;

const room = (x = 0, y = 0) => {
  const w = createWorld();
  w.bubbles.push(newBubble(w, 'soap', 0.3, { x, y, z: 1 }));
  return w;
};

/** Runs for a while; returns how many times it reported being told. */
const run = (
  h: ReturnType<typeof createHint>,
  w: ReturnType<typeof room>,
  s: number,
  on = true,
) => {
  let told = 0;
  for (let i = 0; i < Math.round(s / dt); i++) if (advanceHint(h, w, box, on, dt)) told++;
  return told;
};

test('waits for a bubble left alone, then plays once and never again', () => {
  const h = createHint();
  expect(run(h, createWorld(), 20)).toBe(0);
  const w = room();
  run(h, w, H.wait - 0.1);
  expect(h.age).toBe(-1);
  run(h, w, 0.2);
  expect(h.age).toBeGreaterThanOrEqual(0);
  expect(run(h, w, 30)).toBe(1);
  expect(h.age).toBe(-1);
});

test('does not play while unwanted, or over bubbles that are popping', () => {
  const h = createHint();
  const w = room();
  expect(run(h, w, 20, false)).toBe(0);
  popAll(w);
  expect(run(h, w, 20)).toBe(0);
});

test('a touch sends it away, easing, and it tries again later', () => {
  const h = createHint();
  const w = room();
  run(h, w, H.wait + H.land + H.stroke / 2);
  beginHold(w, box, 0, 1.5, 'soap', false, 1);
  advanceHint(h, w, box, true, dt);
  expect(h.fade).toBeGreaterThan(0.8);
  expect(run(h, w, 20)).toBe(0);
  expect(h.age).toBe(-1);
  w.holds = [];
  expect(run(h, w, 20)).toBe(1);
});

test('it is still showing when told, and fades after', () => {
  const h = createHint();
  const w = room();
  let told = false;
  for (let i = 0; !told && i < 1200; i++) told = advanceHint(h, w, box, true, dt);
  advanceHint(h, w, box, true, dt);
  expect(hintPose(h, false).alpha).toBeGreaterThan(0.8);
  expect(h.age).toBeGreaterThan(0);
});

test('it aims where the bubble is going', () => {
  const h = createHint();
  const w = room();
  w.bubbles[0]!.v.y = -0.5;
  run(h, w, H.wait + 0.1);
  expect(h.y).toBeLessThan(0);
});

test('someone who already knows is never told', () => {
  const h = createHint();
  expect(learnHint(h)).toBe(true);
  expect(learnHint(h)).toBe(false);
  expect(run(h, room(), 20)).toBe(0);
  const known = createHint(true);
  expect(run(known, room(), 20)).toBe(0);
  expect(known.age).toBe(-1);
});

test('the stroke stays on screen, starts and ends unseen, and stands still when calm', () => {
  const h = createHint();
  const w = room(0.9, -2);
  run(h, w, H.wait + 0.05);
  expect(Math.abs(h.x) + H.gap / 2).toBeLessThan(box.hw);
  expect(Math.abs(h.y) + H.travel / 2).toBeLessThan(box.hh);
  h.age = 0;
  expect(hintPose(h, false)).toEqual({ tip: 0, tail: 0, alpha: 0 });
  h.age = H.land + H.stroke / 2;
  const moving = hintPose(h, false);
  expect(moving.tip).toBeGreaterThan(moving.tail);
  expect(hintPose(h, true)).toMatchObject({ tip: 1, tail: 0 });
  h.age = H.land + H.stroke + H.lift;
  expect(hintPose(h, false).alpha).toBe(0);
});
