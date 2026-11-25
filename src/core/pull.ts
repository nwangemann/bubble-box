import { TUNING } from '../config/tuning';
import type { Bubble, World } from './types';

/** One number for a pair of bubbles, whichever comes first. */
export function pairOf(a: Bubble, b: Bubble) {
  'worklet';
  return Math.min(a.id, b.id) * 4096 + Math.max(a.id, b.id);
}

/** Adds to a bubble's velocity. One already past `fastest` may bend, but is never made faster. */
export function nudge(b: Bubble, x: number, y: number, z: number, fastest: number) {
  'worklet';
  const most = Math.max(fastest, Math.hypot(b.v.x, b.v.y, b.v.z));
  b.v.x += x;
  b.v.y += y;
  b.v.z += z;
  const speed = Math.hypot(b.v.x, b.v.y, b.v.z);
  if (speed <= most) return;
  b.v.x *= most / speed;
  b.v.y *= most / speed;
  b.v.z *= most / speed;
}

/**
 * Draws bubbles towards each other, more as they near and the smaller more than the larger. A pair
 * tires of it while close and once they touch, so none clump or circle for ever.
 */
export function attract(world: World, dt: number) {
  'worklet';
  const { pulls, weary, bubbles } = world;
  if (pulls.length === 0 || (world.duel && world.duel.phase !== 'fight')) return;
  const P = TUNING.pull;
  const n = bubbles.length;
  for (let i = 0; i < n; i++) {
    const a = bubbles[i]!;
    if (a.popping >= 0 || a.join || a.shy > 0) continue;
    for (let j = i + 1; j < n; j++) {
      const b = bubbles[j]!;
      if (b.popping >= 0 || b.join || b.shy > 0) continue;
      const pair = pairOf(a, b);
      const pull = pulls[Math.floor(((pair * 0.61803) % 1) * pulls.length)]!;
      const dx = b.p.x - a.p.x;
      const dy = b.p.y - a.p.y;
      const dz = b.p.z - a.p.z;
      const dist = Math.hypot(dx, dy, dz);
      const gap = dist - a.r - b.r;
      if (gap >= pull.reach) continue;
      const tired = weary[pair] ?? 0;
      const near = 1 - Math.max(0, gap) / pull.reach;
      weary[pair] = gap <= 0 ? 1 : Math.min(1, tired + (near * dt) / P.tire);
      if (dist < 1e-6 || tired >= 1) continue;
      const size = Math.pow((a.r + b.r) / 2 / P.usual, pull.heft);
      const ma = a.r ** 3;
      const mb = b.r ** 3;
      const k = (2 * pull.strength * size * near * near * (1 - tired) * dt) / (dist * (ma + mb));
      nudge(a, dx * k * mb, dy * k * mb, dz * k * mb, P.fastest);
      nudge(b, -dx * k * ma, -dy * k * ma, -dz * k * ma, P.fastest);
    }
  }
}

/** Lets pairs forget, slowly. */
export function refresh(world: World, seconds: number) {
  'worklet';
  const { weary } = world;
  for (const key in weary) {
    weary[key] = weary[key]! - seconds / TUNING.pull.rest;
    if (weary[key]! <= 0) delete weary[key];
  }
}
