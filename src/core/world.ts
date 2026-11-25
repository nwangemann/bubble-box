import { TUNING as T } from '../config/tuning';
import type { Feel } from '../config/feels';
import { direct, grown, oddsOf, sizeOf, strike } from './duel';
import { scaleAt, unproject } from './projection';
import { agePuffs, feelPuffs, startPuff } from './puff';
import { attract, pairOf, refresh } from './pull';
import { layTrails } from './trail';
import type { Axis, Box, Bubble, Burst, FxPools, Held, Vec3, World } from './types';

export function createWorld(fx: FxPools = { meet: [], pop: [], lives: {}, pieces: {} }): World {
  'worklet';
  return {
    bubbles: [],
    ripples: [],
    waves: [],
    bursts: [],
    puffs: [],
    fx,
    merges: [false],
    pulls: [],
    weary: {},
    trailLooks: [],
    trails: [],
    sweep: null,
    holds: [],
    steady: null,
    tilt: { rest: null, pull: { x: 0, y: 0, z: 0 } },
    time: 0,
    leftover: 0,
    nextId: 1,
    duel: null,
    impact: 0,
    popped: 0,
  };
}

/** A round, resting bubble that is not yet in the world. */
export function newBubble(world: World, style: string, r: number, p: Vec3): Bubble {
  'worklet';
  const id = world.nextId++;
  return {
    id,
    style,
    seed: (id * 0.61803) % 1,
    r,
    p,
    v: { x: 0, y: 0, z: 0 },
    d: { x: 0, y: 0, z: 0 },
    dv: { x: 0, y: 0, z: 0 },
    spin: 0,
    turn: 0,
    popping: -1,
    popFx: '',
    join: null,
    fade: 1,
    reach: { x: 0, y: 0 },
    shy: 0,
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
  b.join = null;
  b.popFx = pick(world, world.fx.pop);
  world.popped = Math.max(world.popped, b.r);
  startPuff(world, b);
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
    if (o.popping < 0 && !o.join && ++alive > T.maxBubbles) startPop(world, o);
  }
}

/** Pops a bubble, breaking it into small ones if its effect has pieces. */
export function popApart(world: World, b: Bubble) {
  'worklet';
  if (b.popping >= 0) return;
  startPop(world, b);
  const pieces = b.r >= T.brood.minRadius ? (world.fx.pieces[b.popFx] ?? 0) : 0;
  for (let i = 0; i < pieces; i++) {
    const a = ((i + b.seed) / pieces) * Math.PI * 2;
    const r = b.r * T.brood.size * (0.8 + 0.3 * ((i * 0.618) % 1));
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const out = T.brood.speed;
    const at = { x: b.p.x + dx * b.r * 0.55, y: b.p.y + dy * b.r * 0.55, z: b.p.z };
    const piece = newBubble(world, b.style, r, at);
    piece.v = { x: b.v.x + dx * out, y: b.v.y + dy * out, z: b.v.z + (i % 2 ? 0.3 : -0.3) };
    piece.spin = b.spin;
    piece.turn = b.turn;
    // Pieces are born touching.
    piece.shy = T.merge.shy;
    world.bubbles.push(piece);
  }
  if (pieces > 0) trim(world);
}

/** A bubble's feel. With several in play each bubble keeps one for life. */
export function feelOf(b: Bubble, feels: Feel[]) {
  'worklet';
  return feels[Math.floor(((b.id * 0.75488) % 1) * feels.length)]!;
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

/** The living bubble with this id, or the one it is sinking into. */
function wholeOf(world: World, id: number) {
  'worklet';
  const b = world.bubbles.find((o) => o.id === id && o.popping < 0);
  const into = b?.join?.into;
  return into ? world.bubbles.find((o) => o.id === into && o.popping < 0) : b;
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

/** What a finger is holding, if anything. */
export function heldBy(world: World, finger = 0) {
  'worklet';
  return world.holds.find((h) => h.finger === finger);
}

function drop(world: World, finger: number) {
  'worklet';
  world.holds = world.holds.filter((h) => h.finger !== finger);
}

/** True while a touch on a bubble could still turn out to be a tap. */
export function mayBeTap(h: Held) {
  'worklet';
  if (!h.tapPops || h.over === 0 || h.seconds > T.tap.seconds) return false;
  return Math.hypot(h.target.x - h.start.x, h.target.y - h.start.y) <= T.tap.slop;
}

/** True while a touch on a bubble could still turn out to be a flick. */
export function mayBeFlick(h: Held) {
  'worklet';
  return h.over !== 0 && h.seconds <= (h.flicking ? T.flick.seconds : T.flick.decide);
}

/** True while a touch may be meant for the bubble beneath it, so its own stays hidden. */
export function undecided(h: Held) {
  'worklet';
  return mayBeTap(h) || mayBeFlick(h);
}

/** Held bubbles that can be seen and bumped into. */
export function heldBubbles(world: World) {
  'worklet';
  return world.holds.filter((h) => !undecided(h)).map((h) => h.bubble);
}

/** Ends a touch as a tap if it was one. Returns whether it popped a bubble. */
export function finishTap(world: World, finger = 0) {
  'worklet';
  const h = heldBy(world, finger);
  if (!h || !mayBeTap(h)) return false;
  drop(world, finger);
  const target = wholeOf(world, h.over);
  if (target) popApart(world, target);
  return true;
}

export function moveHold(world: World, sx: number, sy: number, finger = 0) {
  'worklet';
  const h = heldBy(world, finger);
  if (!h) return;
  h.target.x = sx;
  h.target.y = sy;
  if (mayBeFlick(h) && Math.hypot(sx - h.start.x, sy - h.start.y) > T.flick.slop) h.flicking = true;
  h.recent.push({ x: sx, y: sy, t: h.seconds });
  h.recent = h.recent.filter((p) => h.seconds - p.t <= T.swipe.window);
  const last = h.trail[h.trail.length - 1];
  if (last && Math.hypot(sx - last.x, sy - last.y) < T.spin.spacing) return;
  h.trail.push({ x: sx, y: sy, t: h.seconds });
  h.trail = h.trail.filter((p) => h.seconds - p.t <= T.spin.window);
}

/** Finger velocity in units per second, fading to nothing when the finger rests. */
export function swipeOf(h: Held) {
  'worklet';
  const from = h.recent.find((p) => h.seconds - p.t <= T.swipe.window);
  if (!from) return { x: 0, y: 0 };
  const dt = Math.max(T.swipe.least, h.seconds - from.t);
  return { x: (h.target.x - from.x) / dt, y: (h.target.y - from.y) / dt };
}

/** Ends a touch as a flick if it was one. Returns whether it nudged a bubble. */
export function finishFlick(world: World, box: Box, feels: Feel[], finger = 0) {
  'worklet';
  const F = T.flick;
  const h = heldBy(world, finger);
  if (!h || !h.flicking || !mayBeFlick(h)) return false;
  const b = wholeOf(world, h.over);
  const swipe = swipeOf(h);
  const speed = Math.hypot(swipe.x, swipe.y);
  if (!b || speed < F.least) return false;
  drop(world, finger);
  const feel = feelOf(b, feels);
  const limit = Math.min(1, F.max / speed);
  const push = (F.gain * limit * feel.speed) / (1 + b.r * F.heaviness);
  // Sideways it keeps pace as seen on the screen, however deep it is.
  const s = scaleAt(box, b.p.z);
  b.v.x += (swipe.x * push) / s;
  b.v.y += (swipe.y * push) / s;
  b.v.z += speed * push * F.forward;
  const twist = h.grip.x * swipe.y - h.grip.y * swipe.x;
  b.spin = clamp(b.spin + twist * limit * F.twist * feel.speed, -T.spin.max, T.spin.max);
  // It gives along the push and swells across it.
  const ux = swipe.x / speed;
  const uy = swipe.y / speed;
  const k = speed * push * F.wobble * feel.wobble;
  b.dv.x += k * (0.5 - 1.5 * ux * ux);
  b.dv.y += k * (0.5 - 1.5 * uy * uy);
  b.dv.z += k * 0.5;
  return true;
}

/** Spin from how far the finger's path bent just before letting go. */
export function spinOf(held: Held, swipe: number) {
  'worklet';
  const S = T.spin;
  const trail = held.trail.filter((p) => held.seconds - p.t <= S.window);
  let bend = 0;
  for (let i = 2; i < trail.length; i++) {
    const a = trail[i - 2]!;
    const b = trail[i - 1]!;
    const c = trail[i]!;
    const ux = b.x - a.x;
    const uy = b.y - a.y;
    const vx = c.x - b.x;
    const vy = c.y - b.y;
    const angle = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    // What came before a sharp corner was another gesture.
    if (Math.abs(angle) > S.corner) bend = 0;
    else bend += angle;
  }
  const size = Math.max(0, Math.abs(bend) - S.slop) * S.gain;
  return Math.sign(bend) * Math.min(S.max, size) * Math.min(1, swipe / S.full);
}

/** Launches the held bubble. `swipeX`, `swipeY` are finger velocity in units per second. */
export function release(world: World, swipeX: number, swipeY: number, speed: number, finger = 0) {
  'worklet';
  const held = heldBy(world, finger);
  if (!held) return;
  drop(world, finger);
  if (world.sweep) world.sweep.launched.push(held.bubble.id);
  const b = held.bubble;
  const charge = chargeAt(Math.min(held.seconds, world.steady?.charge ?? Infinity));
  const L = T.launch;
  const swipe = Math.hypot(swipeX, swipeY);
  const limit = swipe > L.maxSwipe / L.swipe ? L.maxSwipe / L.swipe / swipe : 1;
  const lateral = (L.swipe * limit * speed) / (1 + charge * L.heaviness);
  b.v.x = swipeX * lateral;
  b.v.y = swipeY * lateral;
  b.v.z = (L.base + L.hold * charge + L.swipeForward * swipe * limit) * speed;
  b.spin = spinOf(held, swipe) * Math.min(1, speed);
  // Letting go of the glass stretches the bubble along its flight.
  b.dv.z += 1.2;
  b.dv.x -= 0.9;
  b.dv.y -= 0.9;
  world.bubbles.push(b);
  trim(world);
}

/** Starts a bubble against the glass. `sx`, `sy` are screen-plane coordinates. */
export function beginHold(
  world: World,
  box: Box,
  sx: number,
  sy: number,
  style: string,
  tapPops = false,
  finger = 0,
) {
  'worklet';
  release(world, 0, 0, 1, finger);
  const r = world.steady?.r ?? radiusAt(0);
  const at = { x: unproject(box, sx, r), y: unproject(box, sy, r), z: r };
  const bubble = newBubble(world, style, r, at);
  const over = bubbleAt(world, box, sx, sy);
  const under = world.bubbles.find((b) => b.id === over);
  const grip = { x: 0, y: 0 };
  if (under) {
    const s = scaleAt(box, under.p.z);
    // The reach is wider than a small bubble, so a touch may land outside its edge.
    const span = Math.max(under.r * s, T.tap.reach);
    grip.x = (sx - under.p.x * s) / span;
    grip.y = (sy - under.p.y * s) / span;
  }
  world.holds.push({
    finger,
    bubble,
    seconds: 0,
    target: { x: sx, y: sy },
    start: { x: sx, y: sy },
    trail: [{ x: sx, y: sy, t: 0 }],
    recent: [{ x: sx, y: sy, t: 0 }],
    over,
    grip,
    tapPops,
    flicking: false,
  });
}

/**
 * Begins a sweep once two fresh fingers are both travelling. What they had begun is taken back, and
 * returned so their paths so far can be swept. Other fingers keep their bubbles.
 */
export function beginSweep(world: World): Held[] {
  'worklet';
  if (world.sweep) return [];
  const fresh = world.holds.filter((h) => h.seconds < T.sweep.fresh);
  const moving = fresh.filter(
    (h) => Math.hypot(h.target.x - h.start.x, h.target.y - h.start.y) >= T.sweep.slop,
  );
  if (moving.length < 2) return [];
  world.holds = world.holds.filter((h) => !fresh.includes(h));
  world.sweep = { firstSpared: world.nextId, launched: [] };
  return fresh;
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
  let count = 0;
  for (const b of [...world.bubbles]) {
    if (b.popping >= 0 || b.id >= sweep.firstSpared || sweep.launched.includes(b.id)) continue;
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

/** Radius of the largest bubble popped since last asked, or 0. */
export function takePopped(world: World) {
  'worklet';
  const r = world.popped;
  world.popped = 0;
  return r;
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
  // A spinning bubble rolls a little along a side wall.
  if (axis !== 'z') {
    const kick = T.spin.grip * b.spin * b.r * side;
    if (axis === 'x') b.v.y -= kick;
    else b.v.x += kick;
    b.spin *= T.spin.keep;
  }
  world.impact = Math.max(world.impact, into);
  // Chooses the glass when several are in play; the wave and the ring must agree.
  const variant = Math.random();
  if (axis === 'z' && side < 0 && into > T.glass.minImpact) {
    // The contact point lies on the glass, so it needs no projection.
    world.waves.push({
      x: b.p.x,
      y: b.p.y,
      age: 0,
      strength: Math.min(1, (0.4 + into / 2.5) * (0.65 + b.r)),
      variant,
    });
    if (world.waves.length > T.glass.maxWaves) world.waves.shift();
  }
  if (into < 0.12) return;
  const p = { x: b.p.x, y: b.p.y, z: b.p.z };
  p[axis] = side < 0 ? lo : hi;
  world.ripples.push({ p, axis, age: 0, strength: Math.min(1, into / 3) * (0.4 + b.r), variant });
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
  const pair = pairOf(a, b);
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

function smooth(t: number) {
  'worklet';
  const k = clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
}

/** Lets the smaller of two touching bubbles sink into the larger. Returns whether it did. */
function startMerge(world: World, a: Bubble, b: Bubble) {
  'worklet';
  if (a.shy > 0 || b.shy > 0) return false;
  const lo = Math.min(a.id, b.id);
  const hi = Math.max(a.id, b.id);
  const verdict = (lo * 0.61803 + hi * 0.75488) % 1;
  if (!world.merges[Math.floor(verdict * world.merges.length)]) return false;
  // The older keeps its look when they are the same size.
  const aStays = a.r === b.r ? a.id < b.id : a.r > b.r;
  const large = aStays ? a : b;
  const small = aStays ? b : a;
  let volume = a.r ** 3 + b.r ** 3;
  for (const o of world.bubbles) {
    // One that is still taking another in finishes first.
    if (o.join?.into === small.id) return false;
    if (o.join?.into === large.id) volume += o.r ** 3;
  }
  if (volume > T.merge.maxRadius ** 3) return false;
  small.join = { into: large.id, seconds: 0 };
  return true;
}

/**
 * Moves a sinking bubble on. It passes its volume over bit by bit, taking momentum and the centre of
 * mass with it, so nothing jumps.
 */
function sink(world: World, b: Bubble, feels: Feel[], dt: number) {
  'worklet';
  const M = T.merge;
  const join = b.join;
  if (!join || join.seconds >= M.seconds) return;
  const a = world.bubbles.find((o) => o.id === join.into && o.popping < 0);
  if (!a) {
    startPop(world, b);
    return;
  }
  // Rounding can leave it empty a step early. What it sinks into may be empty too, so stop here.
  if (b.r <= 1e-6) {
    join.seconds = M.seconds;
    return;
  }
  const before = smooth(join.seconds / M.seconds);
  join.seconds += dt;
  const u = Math.min(1, join.seconds / M.seconds);
  b.fade = 1 - smooth((u - 0.2) / 0.8);
  const ma = a.r ** 3;
  const mb = b.r ** 3;
  const dx = b.p.x - a.p.x;
  const dy = b.p.y - a.p.y;
  const dz = b.p.z - a.p.z;
  const vx = b.v.x - a.v.x;
  const vy = b.v.y - a.v.y;
  const vz = b.v.z - a.v.z;
  const dist = Math.hypot(dx, dy, dz);
  const nx = dist > 1e-6 ? dx / dist : 0;
  const ny = dist > 1e-6 ? dy / dist : 0;
  const nz = dist > 1e-6 ? dz / dist : 0;
  // Drawn together without overshooting.
  const ka = (M.pull * dt) / (ma + mb);
  const ax = (M.pull * dx + 2 * vx) * ka;
  const ay = (M.pull * dy + 2 * vy) * ka;
  const az = (M.pull * dz + 2 * vz) * ka;
  a.v.x += ax * mb;
  a.v.y += ay * mb;
  a.v.z += az * mb;
  b.v.x -= ax * ma;
  b.v.y -= ay * ma;
  b.v.z -= az * ma;
  const given = u >= 1 ? mb : (mb * (smooth(u) - before)) / (1 - before);
  const share = given / (ma + given);
  a.p.x += dx * share;
  a.p.y += dy * share;
  a.p.z += dz * share;
  a.v.x += (b.v.x - a.v.x) * share;
  a.v.y += (b.v.y - a.v.y) * share;
  a.v.z += (b.v.z - a.v.z) * share;
  // In a showdown winners grow by their own rule. See `swell` in `duel`.
  if (!world.duel) a.r = Math.cbrt(ma + given);
  b.r = Math.cbrt(Math.max(0, mb - given));
  const orbit = (dx * vy - dy * vx) / Math.max(1e-6, 0.4 * a.r * a.r);
  a.spin += (b.spin - a.spin) * share + orbit * share * M.twist;
  a.spin = clamp(a.spin, -T.spin.max, T.spin.max);
  const k = world.duel ? 0 : share * M.stretch * feelOf(a, feels).wobble;
  a.dv.x += k * (1.5 * nx * nx - 0.5);
  a.dv.y += k * (1.5 * ny * ny - 0.5);
  a.dv.z += k * (1.5 * nz * nz - 0.5);
  if (world.duel) {
    const R = T.showdown.ring;
    strike(world, a, nx, ny, nz, share * R.stretch, share * R.pear);
    return;
  }
  // Both edges swell into a neck, then relax. A small one moves a large edge less.
  const swell = M.reach * Math.sin(Math.PI * Math.sqrt(u)) * (1 - Math.exp(-M.ease * dt));
  const little = Math.min(1, b.r / a.r);
  a.reach.x += nx * swell * little;
  a.reach.y += ny * swell * little;
  b.reach.x -= nx * swell;
  b.reach.y -= ny * swell;
}

/** Entrants that touch settle it on the spot. Returns whether the loser is being taken in. */
function settle(world: World, a: Bubble, b: Bubble, nx: number, ny: number, nz: number) {
  'worklet';
  const duel = world.duel;
  if (!duel || duel.phase !== 'fight') return false;
  // While one is still growing they only bounce, so swelling cannot sweep up a whole crowd at once.
  if (!grown(duel, a) || !grown(duel, b)) return false;
  const aWins = Math.random() < oddsOf(world, a, b);
  const winner = aWins ? a : b;
  const loser = aWins ? b : a;
  duel.clashes.push({
    winner: winner.id,
    loser: loser.id,
    p: { x: a.p.x + nx * a.r, y: a.p.y + ny * a.r, z: a.p.z + nz * a.r },
    at: { x: loser.p.x, y: loser.p.y, z: loser.p.z },
    v: { x: loser.v.x, y: loser.v.y, z: loser.v.z },
    r: loser.r,
    age: 0,
  });
  duel.log.push({
    winner: winner.id,
    seconds: duel.seconds,
    odds: sizeOf(world, loser) / sizeOf(world, winner),
  });
  duel.out++;
  duel.wins[winner.id] = (duel.wins[winner.id] ?? 0) + 1;
  duel.since = 0;
  const R = T.showdown.ring;
  const size = sizeOf(world, winner);
  duel.sizes[winner.id] = Math.max(size, Math.min(T.showdown.largest, size * duel.grow));
  if (!duel.absorb) {
    strike(world, winner, nx, ny, nz, -R.blow, 0);
    startPop(world, loser);
    return false;
  }
  // The film between them has burst: one drains into the other. See `sink`.
  loser.join = { into: winner.id, seconds: 0 };
  return true;
}

/** Equal-density collision. A held bubble has infinite mass. */
function collide(
  world: World,
  a: Bubble,
  b: Bubble,
  aHeld: boolean,
  bounceScale: number,
  feels: Feel[],
) {
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
  if (!aHeld && settle(world, a, b, nx, ny, nz)) return;
  if (!aHeld && startMerge(world, a, b)) {
    const rate = (a.v.x - b.v.x) * nx + (a.v.y - b.v.y) * ny + (a.v.z - b.v.z) * nz;
    meet(world, a, b, nx, ny, nz, rate);
    return;
  }
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
  const fa = feelOf(a, feels);
  const fb = feelOf(b, feels);
  const e = Math.min(1, ((fa.restitution + fb.restitution) / 2) * bounceScale);
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
  squash(a, axis, closing * 0.6, fa.wobble);
  squash(b, axis, closing * 0.6, fb.wobble);
}

/** Bubbles held by different fingers press apart along the glass. The larger gives less. */
function pressHeld(world: World) {
  'worklet';
  const held = heldBubbles(world);
  for (let i = 0; i < held.length; i++) {
    const a = held[i]!;
    for (let j = i + 1; j < held.length; j++) {
      const b = held[j]!;
      const dx = b.p.x - a.p.x;
      const dy = b.p.y - a.p.y;
      const flat = Math.hypot(dx, dy);
      const gap = a.r + b.r - Math.hypot(flat, b.p.z - a.p.z);
      if (gap <= 0) continue;
      const nx = flat > 1e-6 ? dx / flat : 1;
      const ny = flat > 1e-6 ? dy / flat : 0;
      const push = gap * T.heldPush;
      const share = b.r / (a.r + b.r);
      a.p.x -= nx * push * share;
      a.p.y -= ny * push * share;
      b.p.x += nx * push * (1 - share);
      b.p.y += ny * push * (1 - share);
    }
  }
}

function step(world: World, box: Box, feels: Feel[], bounceScale: number, dt: number) {
  'worklet';
  world.time += dt;
  const t = world.time;
  direct(world, box, dt);
  attract(world, dt);
  for (const held of world.holds) {
    const b = held.bubble;
    held.seconds += dt;
    b.r = world.steady?.r ?? radiusAt(held.seconds);
    b.p.z = b.r;
    const ease = 1 - Math.exp(-T.grow.follow * dt);
    const tx = clamp(unproject(box, held.target.x, b.r), -box.hw + b.r, box.hw - b.r);
    const ty = clamp(unproject(box, held.target.y, b.r), -box.hh + b.r, box.hh - b.r);
    b.p.x += (tx - b.p.x) * ease;
    b.p.y += (ty - b.p.y) * ease;
    // Breath.
    b.dv.x += Math.sin(t * 3.1) * 0.35 * dt * 10;
    b.dv.y += Math.sin(t * 3.1 + 2.2) * 0.35 * dt * 10;
    if (!undecided(held)) feelPuffs(world, b, feelOf(b, feels), true, dt);
    relaxShape(b, dt);
  }
  pressHeld(world);
  const { pull } = world.tilt;
  const spinFade = Math.exp(-dt / T.spin.fade);
  for (const b of world.bubbles) {
    const feel = feelOf(b, feels);
    const fade = Math.exp(-feel.drag * dt);
    if (b.popping >= 0) b.popping += dt;
    b.shy = Math.max(0, b.shy - dt);
    const ph = b.seed * 40;
    b.v.x += Math.sin(t * 0.43 + ph) * feel.wander * dt;
    b.v.y += (Math.sin(t * 0.37 + ph * 1.7) * feel.wander - feel.buoyancy) * dt;
    b.v.z += Math.sin(t * 0.31 + ph * 2.3) * feel.wander * dt;
    b.v.x += pull.x * feel.tilt * dt;
    b.v.y += pull.y * feel.tilt * dt;
    b.v.z += pull.z * feel.tilt * dt;
    feelPuffs(world, b, feel, false, dt);
    let speed = Math.hypot(b.v.x, b.v.y, b.v.z);
    let k = fade;
    if (speed > T.maxSpeed) k = T.maxSpeed / speed;
    else if (speed * fade < feel.minSpeed && speed > 1e-4) k = 1 + 0.5 * dt;
    b.v.x *= k;
    b.v.y *= k;
    b.v.z *= k;
    // Spin bends the path the way the finger was bending.
    const bend = b.spin * T.spin.curve * dt;
    const cos = Math.cos(bend);
    const sin = Math.sin(bend);
    const vx = b.v.x;
    b.v.x = vx * cos - b.v.y * sin;
    b.v.y = vx * sin + b.v.y * cos;
    b.turn += b.spin * dt;
    b.spin *= spinFade;
    b.p.x += b.v.x * dt;
    b.p.y += b.v.y * dt;
    b.p.z += b.v.z * dt;
    relaxShape(b, dt);
  }
  agePuffs(world, dt);
  const settle = Math.exp(-T.merge.ease * dt);
  for (const b of world.bubbles) {
    b.reach.x *= settle;
    b.reach.y *= settle;
  }
  for (const b of world.bubbles) sink(world, b, feels, dt);
  for (const b of world.bubbles) {
    const reach = Math.hypot(b.reach.x, b.reach.y);
    if (reach <= T.merge.maxReach) continue;
    b.reach.x *= T.merge.maxReach / reach;
    b.reach.y *= T.merge.maxReach / reach;
  }
  const solid = heldBubbles(world);
  const n = world.bubbles.length;
  for (let i = 0; i < n; i++) {
    const a = world.bubbles[i]!;
    if (a.popping >= 0 || a.join) continue;
    for (const h of solid) collide(world, h, a, true, bounceScale, feels);
    for (let j = i + 1; j < n; j++) {
      const b = world.bubbles[j]!;
      // A sinking bubble passes through others; either may have just begun to, or been knocked out.
      if (a.join || a.popping >= 0) break;
      if (b.popping < 0 && !b.join) collide(world, a, b, false, bounceScale, feels);
    }
  }
  for (const { bubble: b } of world.holds) {
    b.v.x = b.v.y = b.v.z = 0;
    // Growing neighbours may have pressed it outwards.
    b.p.x = clamp(b.p.x, -box.hw + b.r, box.hw - b.r);
    b.p.y = clamp(b.p.y, -box.hh + b.r, box.hh - b.r);
  }
  // Walls last, so nothing ends a step outside.
  for (const b of world.bubbles) {
    const feel = feelOf(b, feels);
    const e = Math.min(1, feel.restitution * bounceScale);
    bounce(world, b, 'x', -box.hw, box.hw, e, feel);
    bounce(world, b, 'y', -box.hh, box.hh, e, feel);
    bounce(world, b, 'z', 0, box.depth, e, feel);
  }
  layTrails(world, box.focal);
}

/** Advances by real elapsed seconds using fixed steps. */
export function advance(
  world: World,
  box: Box,
  feels: Feel[],
  bounceScale: number,
  seconds: number,
) {
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
  refresh(world, dt);
  world.leftover += dt;
  while (world.leftover >= T.step) {
    step(world, box, feels, bounceScale, T.step);
    world.leftover -= T.step;
  }
  world.bubbles = world.bubbles.filter(
    (b) => b.popping < T.popSeconds && !(b.join && b.join.seconds >= T.merge.seconds),
  );
}
