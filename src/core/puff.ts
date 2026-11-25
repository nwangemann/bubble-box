import { TUNING } from '../config/tuning';
import type { Feel } from '../config/feels';
import { nudge } from './pull';
import type { Bubble, World } from './types';

/** The air a popping bubble lets go. Not in a showdown, where everyone must stay even. */
export function startPuff(world: World, b: Bubble) {
  'worklet';
  if (world.duel) return;
  world.puffs.push({
    p: { x: b.p.x, y: b.p.y, z: b.p.z },
    r: b.r,
    age: 0,
    firstSpared: world.nextId,
  });
}

/**
 * One bubble in a spreading puff. The front takes time to arrive, then swells and passes, so nothing
 * jerks. A held one only shivers.
 */
export function feelPuffs(world: World, b: Bubble, feel: Feel, held: boolean, dt: number) {
  'worklet';
  const P = TUNING.puff;
  if (b.popping >= 0 || b.join) return;
  for (const o of world.puffs) {
    if (b.id >= o.firstSpared) continue;
    const dx = b.p.x - o.p.x;
    const dy = b.p.y - o.p.y;
    const dz = b.p.z - o.p.z;
    const dist = Math.hypot(dx, dy, dz);
    const gap = Math.max(0, dist - b.r - o.r);
    if (gap >= P.reach || dist < 1e-6) continue;
    const u = (o.age - gap / P.speed) / P.seconds;
    if (u <= 0 || u >= 1) continue;
    // Adds up to 1 over the passing of the front.
    const part = ((1 - Math.cos(2 * Math.PI * u)) / P.seconds) * dt;
    const near = 1 - gap / P.reach;
    const size = o.r / P.usual;
    const push = (P.strength * size * near * near * part * feel.speed) / (1 + b.r * P.heaviness);
    const nx = dx / dist;
    const ny = dy / dist;
    const nz = dz / dist;
    if (!held) nudge(b, nx * push, ny * push, nz * push, P.fastest * feel.speed);
    // It gives along the push and swells across it.
    const k = push * P.wobble * feel.wobble;
    b.dv.x += k * (0.5 - 1.5 * nx * nx);
    b.dv.y += k * (0.5 - 1.5 * ny * ny);
    b.dv.z += k * (0.5 - 1.5 * nz * nz);
  }
}

/** Moves the fronts on, once every bubble has felt them. */
export function agePuffs(world: World, dt: number) {
  'worklet';
  if (world.puffs.length === 0) return;
  const P = TUNING.puff;
  for (const o of world.puffs) o.age += dt;
  world.puffs = world.puffs.filter((o) => o.age < P.reach / P.speed + P.seconds);
}
