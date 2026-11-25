import { TUNING } from '../config/tuning';
import type { Box, Bubble, Duel, World } from './types';

/** Entrants still standing. */
export function standing(world: World) {
  'worklet';
  return world.bubbles.filter((b) => b.popping < 0 && !b.join);
}

/** An entrant's size once it has finished growing. */
export function sizeOf(world: World, b: Bubble) {
  'worklet';
  return world.duel?.sizes[b.id] ?? b.r;
}

/** Chance that `a` beats `b`. Equal sizes are always even. */
export function oddsOf(world: World, a: Bubble, b: Bubble) {
  'worklet';
  const k = 3 * (world.duel?.edge ?? 0);
  const ka = Math.pow(sizeOf(world, a), k);
  return ka / (ka + Math.pow(sizeOf(world, b), k));
}

/** Sets a surface ringing along a direction: `k2` stretches it, `k3` pulls it to a pear. */
export function strike(
  world: World,
  b: Bubble,
  nx: number,
  ny: number,
  nz: number,
  k2: number,
  k3: number,
) {
  'worklet';
  const duel = world.duel;
  if (!duel) return;
  const o = duel.ringing[b.id];
  if (!o) {
    duel.ringing[b.id] = { n: { x: nx, y: ny, z: nz }, a2: 0, v2: k2, a3: 0, v3: k3 };
    return;
  }
  // The axis leans towards the new blow; the stronger the ringing, the less.
  const same = o.n.x * nx + o.n.y * ny + o.n.z * nz < 0 ? -1 : 1;
  const lean = Math.abs(k2) / (Math.abs(k2) + Math.abs(o.v2) + 12 * Math.abs(o.a2) + 1e-6);
  o.n.x += (nx * same - o.n.x) * lean;
  o.n.y += (ny * same - o.n.y) * lean;
  o.n.z += (nz * same - o.n.z) * lean;
  const l = Math.max(1e-6, Math.hypot(o.n.x, o.n.y, o.n.z));
  o.n.x /= l;
  o.n.y /= l;
  o.n.z /= l;
  o.v2 += k2;
  o.v3 += k3 * same;
}

/**
 * Surface tension against inertia, as Rayleigh found for a drop: mode l has stiffness
 * l(l-1)(l+2) / r^3 and fades as (l-1)(2l+1) / r^2. Large bubbles ring slow and long.
 */
function ring(duel: Duel, b: Bubble, dt: number) {
  'worklet';
  const o = duel.ringing[b.id];
  if (!o) return;
  const R = TUNING.showdown.ring;
  const stiff = R.tension / b.r ** 3;
  const fade = (2 * R.viscosity) / b.r ** 2;
  o.v2 += (-8 * stiff * o.a2 - 5 * fade * o.v2) * dt;
  o.v3 += (-30 * stiff * o.a3 - 14 * fade * o.v3) * dt;
  o.a2 += o.v2 * dt;
  o.a3 += o.v3 * dt;
  if (Math.abs(o.a2) > R.most2) {
    o.a2 = Math.sign(o.a2) * R.most2;
    o.v2 *= 0.5;
  }
  if (Math.abs(o.a3) > R.most3) {
    o.a3 = Math.sign(o.a3) * R.most3;
    o.v3 *= 0.5;
  }
}

/** Whether a winner has finished growing, all but a little. */
export function grown(duel: Duel, b: Bubble) {
  'worklet';
  return b.r >= (duel.sizes[b.id] ?? 0) * TUNING.showdown.grown;
}

/** Grows a winner towards its new size. */
function swell(duel: Duel, b: Bubble, dt: number) {
  'worklet';
  const size = duel.sizes[b.id];
  if (size) b.r += (size - b.r) * (1 - Math.exp(-TUNING.showdown.swell * dt));
}

function nearestTo(b: Bubble, all: Bubble[]) {
  'worklet';
  let best: Bubble | null = null;
  let least = Infinity;
  for (const o of all) {
    if (o === b) continue;
    const d = Math.hypot(o.p.x - b.p.x, o.p.y - b.p.y, o.p.z - b.p.z) - o.r;
    if (d >= least) continue;
    best = o;
    least = d;
  }
  return best;
}

/** Moves a showdown on by one step. Without one, does nothing. */
export function direct(world: World, box: Box, dt: number) {
  'worklet';
  const duel = world.duel;
  if (!duel) return;
  const S = TUNING.showdown;
  duel.seconds += dt;
  duel.since += dt;
  for (const c of duel.clashes) c.age += dt;
  duel.clashes = duel.clashes.filter((c) => c.age < S.clash);
  const all = standing(world);
  for (const b of all) {
    ring(duel, b, dt);
    if (duel.phase === 'fight') swell(duel, b, dt);
  }
  if (duel.phase === 'ready') {
    const go = duel.seconds >= S.ready;
    for (const b of all) {
      const a = Math.random() * Math.PI * 2;
      b.v.x = go ? Math.cos(a) * S.start : 0;
      b.v.y = go ? Math.sin(a) * S.start : 0;
      b.v.z = go ? (Math.random() - 0.5) * 2 * S.start : 0;
    }
    if (!go) return;
    duel.phase = 'fight';
    duel.seconds = 0;
    duel.since = 0;
    return;
  }
  if (duel.phase === 'fight') {
    if (all.length <= 1) {
      duel.phase = 'won';
      duel.seconds = 0;
      const last = all[0];
      if (!last) return;
      duel.champion = last.id;
      // Fixed now, so rising to the podium does not feed on itself.
      duel.sizes[last.id] = sizeOf(world, last);
      return;
    }
    // The nearest pair always face each other, so every showdown ends.
    const heat = Math.max(0, duel.since - S.patience);
    const turn = Math.min(1, Math.min(S.most, S.least + S.gain * heat) * dt);
    for (const b of all) {
      const rival = nearestTo(b, all)!;
      const dx = rival.p.x - b.p.x;
      const dy = rival.p.y - b.p.y;
      const dz = rival.p.z - b.p.z;
      const k = S.chase / Math.max(1e-6, Math.hypot(dx, dy, dz));
      b.v.x += (dx * k - b.v.x) * turn;
      b.v.y += (dy * k - b.v.y) * turn;
      b.v.z += (dz * k - b.v.z) * turn;
    }
    return;
  }
  const b = all.find((o) => o.id === duel.champion);
  if (!b) return;
  // The last one to lose drains across before the winner rises.
  if (world.bubbles.some((o) => o.join)) duel.seconds = Math.min(duel.seconds, S.bask);
  if (duel.seconds <= S.bask) {
    swell(duel, b, dt);
    return;
  }
  const ease = (1 - Math.exp(-S.rise * dt)) * Math.min(1, duel.seconds - S.bask);
  b.p.x -= b.p.x * ease;
  b.p.y += (box.hh * S.podium.y - b.p.y) * ease;
  b.p.z += (S.podium.z - b.p.z) * ease;
  const size = Math.min(S.podium.most, S.podium.r + (sizeOf(world, b) - S.radius) * S.podium.gain);
  b.r += (size - b.r) * ease;
  b.v.x = b.v.y = b.v.z = 0;
  b.spin = 0;
}

/** How fast time runs: the last pair close in slowly, and the final blow hangs in the air. */
export function paceOf(world: World) {
  'worklet';
  const duel = world.duel;
  if (!duel) return 1;
  const S = TUNING.showdown.slow;
  if (duel.phase === 'won') return duel.seconds < S.after ? S.blow : 1;
  if (duel.phase !== 'fight') return 1;
  const all = standing(world);
  if (all.length !== 2) return 1;
  const a = all[0]!;
  const b = all[1]!;
  const gap = Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y, a.p.z - b.p.z) - a.r - b.r;
  const near = Math.max(0, Math.min(1, 1 - gap / S.gap));
  return 1 - (1 - S.pace) * near;
}
