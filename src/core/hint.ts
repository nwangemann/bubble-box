import { TUNING } from '../config/tuning';
import { scaleAt } from './projection';
import type { Box, World } from './types';

/** The first-time hint: two ghostly fingertips that act out the two-finger swipe. */
export type Hint = {
  /** Seconds the room has been left alone with a bubble in it. */
  waited: number;
  /** Seconds since it began, or -1 while it is not showing. */
  age: number;
  /** 1 until a touch sends it away, then falling to 0. */
  fade: number;
  leaving: boolean;
  /** Told, or not needed. */
  done: boolean;
  /** Middle of the stroke on the screen plane. */
  x: number;
  y: number;
};

export function createHint(done = false): Hint {
  'worklet';
  return { waited: 0, age: -1, fade: 1, leaving: false, done, x: 0, y: 0 };
}

const smooth = (t: number) => {
  'worklet';
  const u = Math.max(0, Math.min(1, t));
  return u * u * u * (u * (u * 6 - 15) + 10);
};

/** Puts the stroke where the nearest bubble should be halfway through it, kept well inside the screen. */
function place(hint: Hint, world: World, box: Box) {
  'worklet';
  const H = TUNING.hint;
  let nearest = Infinity;
  for (const b of world.bubbles) {
    if (b.popping >= 0 || b.p.z >= nearest) continue;
    nearest = b.p.z;
    const ahead = H.land + H.stroke / 2;
    const s = scaleAt(box, Math.max(0, Math.min(box.depth, b.p.z + b.v.z * ahead)));
    const mx = Math.max(0, box.hw - H.gap / 2 - H.margin);
    const my = Math.max(0, box.hh - H.travel / 2 - H.margin);
    hint.x = Math.max(-mx, Math.min(mx, (b.p.x + b.v.x * ahead) * s));
    hint.y = Math.max(-my, Math.min(my, (b.p.y + b.v.y * ahead) * s));
  }
}

/** Moves the hint on. True once, when it has been seen well enough never to return. */
export function advanceHint(hint: Hint, world: World, box: Box, wanted: boolean, dt: number) {
  'worklet';
  const H = TUNING.hint;
  const busy = !wanted || world.holds.length > 0 || world.sweep !== null;
  if (hint.age < 0) {
    if (hint.done || busy || !world.bubbles.some((b) => b.popping < 0)) {
      hint.waited = 0;
      return false;
    }
    hint.waited += dt;
    if (hint.waited < H.wait) return false;
    hint.waited = 0;
    hint.age = 0;
    hint.fade = 1;
    hint.leaving = false;
    place(hint, world, box);
    return false;
  }
  if (busy) hint.leaving = true;
  hint.age += dt;
  if (hint.leaving) hint.fade = Math.max(0, hint.fade - dt / H.leave);
  let told = false;
  // Enough of the stroke has been made, unless a touch cut it short.
  if (!hint.done && !hint.leaving && hint.age >= H.land + H.stroke) {
    hint.done = true;
    told = true;
  }
  if (hint.fade <= 0 || hint.age >= H.land + H.stroke + H.lift) hint.age = -1;
  return told;
}

/** Someone who has popped with two fingers needs no hint. True if that is news. */
export function learnHint(hint: Hint) {
  'worklet';
  if (hint.done) return false;
  hint.done = true;
  hint.leaving = true;
  return true;
}

/** Where the fingertips and the ends of their wakes are, from 0 to 1 along the stroke, and how plain. */
export function hintPose(hint: Hint, calm: boolean) {
  'worklet';
  const H = TUNING.hint;
  const t = hint.age - H.land;
  const alpha = smooth(hint.age / H.land) * (1 - smooth((t - H.stroke) / H.lift)) * hint.fade;
  if (calm) return { tip: 1, tail: 0, alpha };
  return { tip: smooth(t / H.stroke), tail: smooth((t - H.wake) / H.stroke), alpha };
}
