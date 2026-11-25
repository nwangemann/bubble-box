import { trailPool } from '../config/defaults';
import { FEELS } from '../config/feels';
import { TRAILS } from '../config/trails';
import { TUNING } from '../config/tuning';
import { imagesOf, sideOf } from './trail';
import type { Box } from './types';
import { advance, createWorld, newBubble, popAll } from './world';

const box: Box = { hw: 1, hh: 2.17, depth: 5, focal: 3.2 };
const feel = { ...FEELS.weightless, minSpeed: 0 };
const run = (w: ReturnType<typeof createWorld>, s: number) => {
  for (let i = 0; i < s * 60; i++) advance(w, box, [feel], 1, 1 / 60);
};
const moving = (v = { x: 0.8, y: 0.5, z: 0.6 }) => {
  const w = createWorld();
  w.trailLooks = [TRAILS.ribbon];
  const b = newBubble(w, 'soap', 0.2, { x: 0, y: 0, z: 2 });
  b.v = v;
  w.bubbles.push(b);
  return { w, b };
};

test('None leaves nothing', () => {
  const { w } = moving();
  w.trailLooks = trailPool('none');
  run(w, 1);
  expect(w.trails).toEqual([]);
});

test('a trail stays short and recent, however fast the bubble', () => {
  const { w } = moving({ x: 5, y: 4, z: 3 });
  run(w, 8);
  const [trail] = w.trails;
  expect(w.trails).toHaveLength(1);
  expect(trail!.points.length).toBeGreaterThan(10);
  expect(trail!.points.length).toBeLessThanOrEqual(TUNING.trail.maxPoints);
  // The oldest may linger so the end can fade.
  for (const p of trail!.points.slice(1))
    expect(w.time - p.t).toBeLessThan(TRAILS.ribbon.seconds + 0.02);
});

test('a trail outlives its bubble, then goes', () => {
  const { w } = moving();
  run(w, 1);
  popAll(w);
  run(w, TUNING.popSeconds + 0.1);
  expect(w.bubbles).toHaveLength(0);
  expect(w.trails).toHaveLength(1);
  run(w, TRAILS.ribbon.seconds);
  expect(w.trails).toHaveLength(0);
});

test('choosing None lets a trail fade', () => {
  const { w } = moving();
  run(w, 1);
  w.trailLooks = [];
  run(w, 0.5);
  expect(w.trails).toHaveLength(1);
  run(w, TRAILS.ribbon.seconds);
  expect(w.trails).toHaveLength(0);
});

test('a resting bubble lays almost nothing', () => {
  const { w } = moving({ x: 0, y: 0, z: 0 });
  run(w, 2);
  expect(w.trails[0]?.points.length ?? 0).toBeLessThanOrEqual(1);
});

test('a trail lies across the line of sight and never flips', () => {
  const p = { x: 0.3, y: -0.4, z: 1 };
  const v = { x: 1, y: 0.2, z: 0.5 };
  const a = sideOf(p, v, null, box.focal);
  expect(Math.hypot(a.x, a.y, a.z)).toBeCloseTo(1);
  expect(a.x * v.x + a.y * v.y + a.z * v.z).toBeCloseTo(0);
  const back = sideOf(p, { x: -1, y: -0.2, z: -0.5 }, a, box.focal);
  expect(a.x * back.x + a.y * back.y + a.z * back.z).toBeCloseTo(1);
  // Straight away from the eye it keeps the way it lay.
  const away = sideOf(p, { x: 0.3, y: -0.4, z: 4.2 }, a, box.focal);
  expect(a.x * away.x + a.y * away.y + a.z * away.z).toBeCloseTo(1);
});

test('images are evenly spaced and stay put as the path goes on', () => {
  const { w } = moving();
  run(w, 1);
  const [trail] = w.trails;
  const before = imagesOf(trail!.points, 0.8);
  expect(before.length).toBeGreaterThan(2);
  before.forEach((o, i) => {
    if (i > 0) expect(o.along - before[i - 1]!.along).toBeCloseTo(0.8);
  });
  run(w, 0.5);
  const after = imagesOf(trail!.points, 0.8);
  expect(after.length).toBeGreaterThan(before.length);
  for (const o of before) expect(after).toContainEqual(o);
});
