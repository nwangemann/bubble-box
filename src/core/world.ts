import { TUNING as T } from '../config/tuning';
import type { Feel } from '../config/feels';
import { scaleAt, unproject } from './projection';
import type { Axis, Box, Bubble, World } from './types';

export function createWorld(): World {
  'worklet';
  return {
    bubbles: [],
    ripples: [],
    waves: [],
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
  for (const b of world.bubbles) if (b.id === over && b.popping < 0) b.popping = 0;
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
  world.bubbles.push(b);
  let alive = 0;
  for (let i = world.bubbles.length - 1; i >= 0; i--) {
    const o = world.bubbles[i]!;
    if (o.popping < 0 && ++alive > T.maxBubbles) o.popping = 0;
  }
}

export function popAll(world: World) {
  'worklet';
  for (const b of world.bubbles) if (b.popping < 0) b.popping = 0;
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

/** Equal-density collision. A held bubble has infinite mass. */
function collide(a: Bubble, b: Bubble, aHeld: boolean, e: number, feel: Feel) {
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
    if (solid) collide(solid.bubble, a, true, e, feel);
    for (let j = i + 1; j < n; j++) {
      const b = world.bubbles[j]!;
      if (b.popping < 0) collide(a, b, false, e, feel);
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
  for (const w of world.waves) w.age += dt;
  world.waves = world.waves.filter((w) => w.age < T.glass.seconds);
  world.leftover += dt;
  while (world.leftover >= T.step) {
    step(world, box, feel, bounceScale, T.step);
    world.leftover -= T.step;
  }
  world.bubbles = world.bubbles.filter((b) => b.popping < T.popSeconds);
}
