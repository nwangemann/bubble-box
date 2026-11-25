import { FEELS, type Feel } from '../config/feels';
import { calmFeel } from '../config/defaults';
import { TUNING } from '../config/tuning';
import { lean, settleTilt } from './tilt';
import type { Box, Vec3 } from './types';
import { advance, beginHold, createWorld, release } from './world';

const box: Box = { hw: 1, hh: 2.17, depth: 5, focal: 3.2 };
/** Upright, then rolled right or tipped back by an angle. */
const upright: Vec3 = { x: 0, y: 9.81, z: 0 };
const rolled = (a: number): Vec3 => ({ x: 9.81 * Math.sin(a), y: 9.81 * Math.cos(a), z: 0 });
const tipped = (a: number): Vec3 => ({ x: 0, y: 9.81 * Math.cos(a), z: 9.81 * Math.sin(a) });

const hold = (w: ReturnType<typeof createWorld>, g: Vec3 | null, s: number) => {
  for (let i = 0; i < s * 60; i++) lean(w, g, 1 / 60);
};
const size = (p: Vec3) => Math.hypot(p.x, p.y, p.z);

test('however the phone is held at first, nothing pulls', () => {
  for (const g of [upright, rolled(1), tipped(Math.PI / 2), null, { x: 0, y: 0, z: 0 }]) {
    const w = createWorld();
    hold(w, g, 2);
    expect(size(w.tilt.pull)).toBe(0);
  }
});

test('rolling pulls to the low side, and tipping back pulls deeper', () => {
  for (const side of [1, -1]) {
    const w = createWorld();
    hold(w, upright, 0.5);
    hold(w, rolled(0.5 * side), 0.6);
    expect(w.tilt.pull.x * side).toBeGreaterThan(0.1);
    expect(size(w.tilt.pull)).toBeLessThanOrEqual(TUNING.tilt.pull);
  }
  const w = createWorld();
  hold(w, upright, 0.5);
  hold(w, tipped(0.5), 0.6);
  expect(w.tilt.pull.z).toBeGreaterThan(0.1);
});

test('a trembling hand does nothing', () => {
  const w = createWorld();
  hold(w, upright, 0.5);
  hold(w, rolled(TUNING.tilt.slop * 0.9), 0.5);
  expect(size(w.tilt.pull)).toBe(0);
});

test('a tilt that is kept becomes the new rest', () => {
  const w = createWorld();
  hold(w, upright, 0.5);
  hold(w, rolled(0.6), 1);
  const early = size(w.tilt.pull);
  hold(w, rolled(0.6), TUNING.tilt.settle * 5);
  expect(size(w.tilt.pull)).toBeLessThan(early * 0.05);
});

test('losing the sensor eases the pull away, and settling forgets it', () => {
  const w = createWorld();
  hold(w, upright, 0.5);
  hold(w, rolled(0.6), 1);
  const before = size(w.tilt.pull);
  lean(w, null, 1 / 60);
  expect(size(w.tilt.pull)).toBeGreaterThan(before * 0.5);
  hold(w, null, 5);
  expect(size(w.tilt.pull)).toBeLessThan(0.001);
  hold(w, upright, 0.5);
  hold(w, rolled(0.6), 1);
  settleTilt(w);
  hold(w, rolled(0.6), 1);
  expect(size(w.tilt.pull)).toBe(0);
});

const driftRight = (feel: Feel) => {
  const w = createWorld();
  beginHold(w, box, 0, 0, 'ink');
  advance(w, box, [feel], 1, 1 / 60);
  release(w, 0, 0, 1);
  w.tilt.pull = { x: TUNING.tilt.pull, y: 0, z: 0 };
  for (let i = 0; i < 90; i++) advance(w, box, [feel], 1, 1 / 60);
  return w.bubbles[0]!;
};

test('the pull moves bubbles as their feel allows, and not with Reduce Motion', () => {
  const still = { ...FEELS.drift, wander: 0 };
  expect(driftRight(still).p.x).toBeGreaterThan(0.1);
  expect(driftRight(FEELS.weightless).p.x).toBeCloseTo(0);
  expect(driftRight(calmFeel(still)).p.x).toBeCloseTo(0);
});

test('a steady pull rests bubbles on the wall without buzzing', () => {
  // Without air currents or a least speed, only the pull is left.
  const feel = { ...FEELS.drift, wander: 0, minSpeed: 0 };
  const w = createWorld();
  beginHold(w, box, 0, 0, 'ink');
  advance(w, box, [feel], 1, 1 / 60);
  release(w, 0, 0, 1);
  w.tilt.pull = { x: 0, y: TUNING.tilt.pull, z: 0 };
  let loudest = 0;
  for (let i = 0; i < 60 * 60; i++) {
    advance(w, box, [feel], 1, 1 / 60);
    if (i > 50 * 60) loudest = Math.max(loudest, w.impact);
  }
  const b = w.bubbles[0]!;
  expect(b.p.y).toBeCloseTo(box.hh - b.r, 1);
  expect(loudest).toBeLessThan(TUNING.hapticMinImpact);
});
