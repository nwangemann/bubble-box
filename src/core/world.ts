import { TUNING as T } from '../config/tuning';
import type { Feel } from '../config/feels';
import { scaleAt, unproject } from './projection';
import type { Axis, Box, Bubble, Burst, FxPools, World } from './types';

export function createWorld(fx: FxPools = { meet: [], pop: [], lives: {}, pieces: {} }): World {
  'worklet';
  return {
    bubbles: [],
    ripples: [],
    waves: [],
    bursts: [],
    fx,
    sweep: null,
    lastLaunch: { id: 0, time: 0, heldFor: 0 },
    held: null,
    time: 0,
    leftover: 0,
    nextId: 1,
    impact: 0,
  };
}

function clamp(v: number, lo: number, hi: number) {
  'worklet';
  // A bubble wider than its room sits in the middle.
  return lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));
}

function pick(world: World, pool: string[]) {
  'worklet';
  return pool.length === 0 ? '' : pool[Math.floor(Math.random() * pool.length)]!;
}

function addBurst(world: World, burst: Burst) {
  'worklet';
  world.bursts.push(burst);
  if (world.bursts.length > T.burst.max) world.bursts.shift();
}

/** Starts a bubble popping. */
function startPop(world: World, b: Bubble) {
  'worklet';
  if (b.popping >= 0) return;
  b.popping = 0;
  b.popFx = pick(world, world.fx.pop);
  addBurst(world, {
    fx: b.popFx,
    p: { x: b.p.x, y: b.p.y, z: b.p.z },
    v: { x: b.v.x * 0.4, y: b.v.y * 0.4, z: b.v.z * 0.4 },
    n: { x: 0, y: 0, z: 1 },
    spin: b.seed > 0.5 ? 0.6 : -0.6,
    size: b.r,
    strength: 1,
    seed: b.seed,
    age: 0,
    styleA: b.style,
    styleB: b.style,
    pair: 0,
  });
}

/** Past the limit, the oldest go. */
function trim(world: World) {
  'worklet';
  let alive = 0;
  for (let i = world.bubbles.length - 1; i >= 0; i--) {
    const o = world.bubbles[i]!;
    if (o.popping < 0 && ++alive > T.maxBubbles) startPop(world, o);
  }
}

/** Pops a bubble, breaking it into small ones if its effect has pieces. */
function popApart(world: World, b: Bubble) {
  'worklet';
  if (b.popping >= 0) return;
  startPop(world, b);
  const pieces = b.r >= T.brood.minRadius ? (world.fx.pieces[b.popFx] ?? 0) : 0;
  for (let i = 0; i < pieces; i++) {
    const a = ((i + b.seed) / pieces) * Math.PI * 2;
    const r = b.r * T.brood.size * (0.8 + 0.3 * ((i * 0.618) % 1));
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const id = world.nextId++;
    const out = T.brood.speed;
    world.bubbles.push({
      id,
      style: b.style,
      seed: (id * 0.61803) % 1,
      r,
      p: { x: b.p.x + dx * b.r * 0.55, y: b.p.y + dy * b.r * 0.55, z: b.p.z },
      v: { x: b.v.x + dx * out, y: b.v.y + dy * out, z: b.v.z + (i % 2 ? 0.3 : -0.3) },
      d: { x: 0, y: 0, z: 0 },
      dv: { x: 0, y: 0, z: 0 },
      popping: -1,
      popFx: '',
    });
  }
  if (pieces > 0) trim(world);
}

/** 0 at touch, approaching 1 for a long hold. */
export function chargeAt(seconds: number) {
  'worklet';
  return 1 - Math.exp(-seconds / T.grow.tau);
}

/** Never stops growing, but always slows. */
export function radiusAt(seconds: number) {
  'worklet';
  return T.grow.minRadius + (T.grow.maxRadius - T.grow.minRadius) * chargeAt(seconds);
}

/** Nearest bubble under a screen-plane point, or 0. */
export function bubbleAt(world: World, box: Box, sx: number, sy: number) {
  'worklet';
  let id = 0;
  let nearest = Infinity;
  for (const b of world.bubbles) {
    if (b.popping >= 0 || b.p.z >= nearest) continue;
    const s = scaleAt(box, b.p.z);
    if (Math.hypot(b.p.x * s - sx, b.p.y * s - sy) > Math.max(b.r * s, T.tap.reach)) continue;
    id = b.id;
    nearest = b.p.z;
  }
  return id;
}

/** True while a touch on a bubble could still turn out to be a tap. */
export function mayBeTap(world: World) {
  'worklet';
  const h = world.held;
  if (!h || h.over === 0 || h.seconds > T.tap.seconds) return false;
  return Math.hypot(h.target.x - h.start.x, h.target.y - h.start.y) <= T.tap.slop;
}

/** Ends a touch as a tap if it was one. Returns whether it popped a bubble. */
export function finishTap(world: World) {
  'worklet';
  if (!mayBeTap(world)) return false;
  const over = world.held!.over;
  world.held = null;
  const target = world.bubbles.find((b) => b.id === over);
  if (target) popApart(world, target);
  return true;
}

/** Starts a bubble against the glass. `sx`, `sy` are screen-plane coordinates. */
export function beginHold(
  world: World,
  box: Box,
  sx: number,
  sy: number,
  style: string,
  tapPops = false,
) {
  'worklet';
  if (world.held) release(world, 0, 0, 1);
  const r = radiusAt(0);
  const id = world.nextId++;
  const bubble: Bubble = {
    id,
    style,
    seed: (id * 0.61803) % 1,
    r,
    p: { x: unproject(box, sx, r), y: unproject(box, sy, r), z: r },
    v: { x: 0, y: 0, z: 0 },
    d: { x: 0, y: 0, z: 0 },
    dv: { x: 0, y: 0, z: 0 },
    popping: -1,
    popFx: '',
  };
  const over = tapPops ? bubbleAt(world, box, sx, sy) : 0;
  world.held = { bubble, seconds: 0, target: { x: sx, y: sy }, start: { x: sx, y: sy }, over };
}

export function moveHold(world: World, sx: number, sy: number) {
  'worklet';
  if (!world.held) return;
  world.held.target.x = sx;
  world.held.target.y = sy;
}

/** Launches the held bubble. `swipeX`, `swipeY` are finger velocity in units per second. */
export function release(world: World, swipeX: number, swipeY: number, speed: number) {
  'worklet';
  const held = world.held;
  if (!held) return;
  world.held = null;
  const b = held.bubble;
  const charge = chargeAt(held.seconds);
  const L = T.launch;
  const swipe = Math.hypot(swipeX, swipeY);
  const limit = swipe > L.maxSwipe / L.swipe ? L.maxSwipe / L.swipe / swipe : 1;
  const lateral = (L.swipe * limit * speed) / (1 + charge * L.heaviness);
  b.v.x = swipeX * lateral;
  b.v.y = swipeY * lateral;
  b.v.z = (L.base + L.hold * charge + L.swipeForward * swipe * limit) * speed;
  // Letting go of the glass stretches the bubble along its flight.
  b.dv.z += 1.2;
  b.dv.x -= 0.9;
  b.dv.y -= 0.9;
  world.lastLaunch = { id: b.id, time: world.time, heldFor: held.seconds };
  world.bubbles.push(b);
  trim(world);
}

/** A second finger has landed. Whatever the first finger had only just begun is taken back. */
export function beginSweep(world: World) {
  'worklet';
  if (world.sweep) return;
  const L = world.lastLaunch;
  if (world.held && world.held.seconds < T.sweep.undo) world.held = null;
  else if (world.held) release(world, 0, 0, 1);
  else if (L.heldFor < T.sweep.undo && world.time - L.time < 0.12)
    world.bubbles = world.bubbles.filter((b) => b.id !== L.id);
  world.sweep = { firstSpared: world.nextId, travelled: 0 };
}

export function endSweep(world: World) {
  'worklet';
  world.sweep = null;
}

/** Pops what a finger crossed between two screen-plane points. Returns how many. */
export function sweepAlong(world: World, box: Box, ax: number, ay: number, bx: number, by: number) {
  'worklet';
  const sweep = world.sweep;
  if (!sweep) return 0;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  sweep.travelled += Math.sqrt(len2);
  // Two resting fingers pop nothing.
  if (sweep.travelled < T.sweep.slop) return 0;
  let count = 0;
  for (const b of [...world.bubbles]) {
    if (b.popping >= 0 || b.id >= sweep.firstSpared) continue;
    const s = scaleAt(box, b.p.z);
    const px = b.p.x * s - ax;
    const py = b.p.y * s - ay;
    const t = len2 > 0 ? clamp((px * dx + py * dy) / len2, 0, 1) : 0;
    if (Math.hypot(px - dx * t, py - dy * t) > Math.max(b.r * s, T.sweep.reach)) continue;
    popApart(world, b);
    count++;
  }
  return count;
}

export function popAll(world: World) {
  'worklet';
  for (const b of world.bubbles) startPop(world, b);
}

function squash(b: Bubble, axis: Axis, speed: number, wobble: number) {
  'worklet';
  const k = speed * T.wobble.impact * wobble;
  b.dv.x += axis === 'x' ? -k : k / 2;
  b.dv.y += axis === 'y' ? -k : k / 2;
  b.dv.z += axis === 'z' ? -k : k / 2;
}

function bounce(
  world: World,
  b: Bubble,
  axis: Axis,
  lo: number,
  hi: number,
  e: number,
  feel: Feel,
) {
  'worklet';
  const min = lo + b.r;
  const max = hi - b.r;
  const at = b.p[axis];
  if (at >= min && at <= max) return;
  const side = at < min ? -1 : 1;
  b.p[axis] = clamp(at, min, max);
  const into = b.v[axis] * side;
  if (into <= 0) return;
  b.v[axis] = -into * e * side;
  squash(b, axis, into, feel.wobble);
  world.impact = Math.max(world.impact, into);
  if (axis === 'z' && side < 0 && into > T.glass.minImpact) {
    // The contact point lies on the glass, so it needs no projection.
    world.waves.push({
      x: b.p.x,
      y: b.p.y,
      age: 0,
      strength: Math.min(1, (0.4 + into / 2.5) * (0.65 + b.r)),
    });
    if (world.waves.length > T.glass.maxWaves) world.waves.shift();
  }
  if (into < 0.12) return;
  const p = { x: b.p.x, y: b.p.y, z: b.p.z };
  p[axis] = side < 0 ? lo : hi;
  world.ripples.push({ p, axis, age: 0, strength: Math.min(1, into / 3) * (0.4 + b.r) });
  if (world.ripples.length > T.maxRipples) world.ripples.shift();
}

function relaxShape(b: Bubble, dt: number) {
  'worklet';
  const w = T.wobble.stiffness / (0.45 + b.r);
  for (const k of ['x', 'y', 'z'] as const) {
    b.dv[k] += (-w * w * b.d[k] - 2 * T.wobble.damping * b.dv[k]) * dt;
    const next = b.d[k] + b.dv[k] * dt;
    b.d[k] = clamp(next, -T.wobble.max, T.wobble.max);
    if (b.d[k] !== next) b.dv[k] *= 0.5;
  }
}

function meet(
  world: World,
  a: Bubble,
  b: Bubble,
  nx: number,
  ny: number,
  nz: number,
  closing: number,
) {
  'worklet';
  if (closing < T.burst.minClosing || world.fx.meet.length === 0) return;
  const pair = Math.min(a.id, b.id) * 4096 + Math.max(a.id, b.id);
  // Bubbles that stay pressed together flash once, not every step.
  for (const o of world.bursts) if (o.pair === pair && o.age < T.burst.pairPause) return;
  const rx = a.v.x - b.v.x;
  const ry = a.v.y - b.v.y;
  const rz = a.v.z - b.v.z;
  // The part of normal x relative velocity that faces the viewer, plus a little of the rest.
  const rub = nx * ry - ny * rx + 0.35 * (ny * rz - nz * ry + nz * rx - nx * rz);
  addBurst(world, {
    fx: pick(world, world.fx.meet),
    p: { x: a.p.x + nx * a.r, y: a.p.y + ny * a.r, z: a.p.z + nz * a.r },
    v: { x: (a.v.x + b.v.x) * 0.25, y: (a.v.y + b.v.y) * 0.25, z: (a.v.z + b.v.z) * 0.25 },
    n: { x: nx, y: ny, z: nz },
    spin: Math.max(-1, Math.min(1, rub)),
    size: (a.r + b.r) / 2,
    strength: Math.min(1, 0.45 + closing / 3),
    seed: Math.random(),
    age: 0,
    styleA: a.style,
    styleB: b.style,
    pair,
  });
}

/** Equal-density collision. A held bubble has infinite mass. */
function collide(world: World, a: Bubble, b: Bubble, aHeld: boolean, e: number, feel: Feel) {
  'worklet';
  const dx = b.p.x - a.p.x;
  const dy = b.p.y - a.p.y;
  const dz = b.p.z - a.p.z;
  const dist = Math.hypot(dx, dy, dz);
  const gap = a.r + b.r - dist;
  if (gap <= 0) return;
  const nx = dist > 1e-6 ? dx / dist : 0;
  const ny = dist > 1e-6 ? dy / dist : 0;
  const nz = dist > 1e-6 ? dz / dist : 1;
  const ia = aHeld ? 0 : 1 / (a.r * a.r * a.r);
  const ib = 1 / (b.r * b.r * b.r);
  // Overlap eases apart, so soft things press rather than snap.
  const push = (gap * 0.2) / (ia + ib);
  a.p.x -= nx * push * ia;
  a.p.y -= ny * push * ia;
  a.p.z -= nz * push * ia;
  b.p.x += nx * push * ib;
  b.p.y += ny * push * ib;
  b.p.z += nz * push * ib;
  const closing = (a.v.x - b.v.x) * nx + (a.v.y - b.v.y) * ny + (a.v.z - b.v.z) * nz;
  if (closing <= 0) return;
  meet(world, a, b, nx, ny, nz, closing);
  const j = ((1 + e) * closing) / (ia + ib);
  a.v.x -= j * ia * nx;
  a.v.y -= j * ia * ny;
  a.v.z -= j * ia * nz;
  b.v.x += j * ib * nx;
  b.v.y += j * ib * ny;
  b.v.z += j * ib * nz;
  const ax = Math.abs(nx);
  const ay = Math.abs(ny);
  const az = Math.abs(nz);
  const axis: Axis = ax > ay && ax > az ? 'x' : ay > az ? 'y' : 'z';
  squash(a, axis, closing * 0.6, feel.wobble);
  squash(b, axis, closing * 0.6, feel.wobble);
}

function step(world: World, box: Box, feel: Feel, bounceScale: number, dt: number) {
  'worklet';
  world.time += dt;
  const t = world.time;
  const e = Math.min(1, feel.restitution * bounceScale);
  const held = world.held;
  if (held) {
    const b = held.bubble;
    held.seconds += dt;
    b.r = radiusAt(held.seconds);
    b.p.z = b.r;
    const ease = 1 - Math.exp(-T.grow.follow * dt);
    const tx = clamp(unproject(box, held.target.x, b.r), -box.hw + b.r, box.hw - b.r);
    const ty = clamp(unproject(box, held.target.y, b.r), -box.hh + b.r, box.hh - b.r);
    b.p.x += (tx - b.p.x) * ease;
    b.p.y += (ty - b.p.y) * ease;
    // Breath.
    b.dv.x += Math.sin(t * 3.1) * 0.35 * dt * 10;
    b.dv.y += Math.sin(t * 3.1 + 2.2) * 0.35 * dt * 10;
    relaxShape(b, dt);
  }
  const fade = Math.exp(-feel.drag * dt);
  for (const b of world.bubbles) {
    if (b.popping >= 0) b.popping += dt;
    const ph = b.seed * 40;
    b.v.x += Math.sin(t * 0.43 + ph) * feel.wander * dt;
    b.v.y += (Math.sin(t * 0.37 + ph * 1.7) * feel.wander - feel.buoyancy) * dt;
    b.v.z += Math.sin(t * 0.31 + ph * 2.3) * feel.wander * dt;
    let speed = Math.hypot(b.v.x, b.v.y, b.v.z);
    let k = fade;
    if (speed > T.maxSpeed) k = T.maxSpeed / speed;
    else if (speed * fade < feel.minSpeed && speed > 1e-4) k = 1 + 0.5 * dt;
    b.v.x *= k;
    b.v.y *= k;
    b.v.z *= k;
    b.p.x += b.v.x * dt;
    b.p.y += b.v.y * dt;
    b.p.z += b.v.z * dt;
    relaxShape(b, dt);
  }
  const solid = held && !mayBeTap(world) ? held : null;
  const n = world.bubbles.length;
  for (let i = 0; i < n; i++) {
    const a = world.bubbles[i]!;
    if (a.popping >= 0) continue;
    if (solid) collide(world, solid.bubble, a, true, e, feel);
    for (let j = i + 1; j < n; j++) {
      const b = world.bubbles[j]!;
      if (b.popping < 0) collide(world, a, b, false, e, feel);
    }
  }
  if (held) {
    held.bubble.v.x = held.bubble.v.y = held.bubble.v.z = 0;
  }
  // Walls last, so nothing ends a step outside.
  for (const b of world.bubbles) {
    bounce(world, b, 'x', -box.hw, box.hw, e, feel);
    bounce(world, b, 'y', -box.hh, box.hh, e, feel);
    bounce(world, b, 'z', 0, box.depth, e, feel);
  }
}

/** Advances by real elapsed seconds using fixed steps. */
export function advance(world: World, box: Box, feel: Feel, bounceScale: number, seconds: number) {
  'worklet';
  world.impact = 0;
  const dt = Math.min(seconds, T.maxFrame);
  for (const r of world.ripples) r.age += dt;
  world.ripples = world.ripples.filter((r) => r.age < T.rippleSeconds);
  for (const o of world.bursts) {
    o.age += dt;
    o.p.x += o.v.x * dt;
    o.p.y += o.v.y * dt;
    o.p.z = Math.max(0, o.p.z + o.v.z * dt);
  }
  world.bursts = world.bursts.filter((o) => o.age < (world.fx.lives[o.fx] ?? 0));
  for (const w of world.waves) w.age += dt;
  world.waves = world.waves.filter((w) => w.age < T.glass.seconds);
  world.leftover += dt;
  while (world.leftover >= T.step) {
    step(world, box, feel, bounceScale, T.step);
    world.leftover -= T.step;
  }
  world.bubbles = world.bubbles.filter((b) => b.popping < T.popSeconds);
}
