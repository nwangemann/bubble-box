import type { Setting } from '../config/defaults';
import { FEELS, type Feel } from '../config/feels';
import { TUNING } from '../config/tuning';
import type { Tap } from '../config/taps';
import {
  advance,
  beginHold,
  createWorld,
  finishTap,
  popAll,
  popApart,
  release,
} from '../core/world';
import type { Box, Bubble, FxPools, World } from '../core/types';

const P = TUNING.preview;
const STILL_AIR: Feel = { ...FEELS.weightless };

/** What a preview acts out. Lists hold one entry, or every entry for Random. */
export type Part = {
  kind: Setting;
  box: Box;
  styles: string[];
  feels: Feel[];
  taps: Tap[];
  fx: FxPools;
  bounce: number;
  /** Seconds before it first moves, so neighbours do not act in unison. */
  delay: number;
};

/** A small world and where it is in its loop. */
export type Stage = {
  world: World;
  clock: number;
  turn: number;
  /** Opacity of the fingertip. */
  finger: number;
};

export function createStage(part: Part): Stage {
  'worklet';
  // Just short of zero, so the first step still crosses the start.
  return { world: createWorld(part.fx), clock: -part.delay - 1e-6, turn: 0, finger: 0 };
}

function smooth(t: number) {
  'worklet';
  const k = Math.max(0, Math.min(1, t));
  return k * k * (3 - 2 * k);
}

function styleFor(part: Part, turn: number) {
  'worklet';
  return part.styles[turn % part.styles.length]!;
}

function add(stage: Stage, part: Part, x: number, y: number, z: number, r: number, offset = 0) {
  'worklet';
  const w = stage.world;
  const id = w.nextId++;
  const b: Bubble = {
    id,
    style: styleFor(part, stage.turn + offset),
    seed: (id * 0.61803) % 1,
    r,
    p: { x, y, z },
    v: { x: 0, y: 0, z: 0 },
    d: { x: 0, y: 0, z: 0 },
    dv: { x: 0, y: 0, z: 0 },
    popping: -1,
    popFx: '',
  };
  w.bubbles.push(b);
  return b;
}

/** Lets everything go without an effect. */
function clear(stage: Stage, part: Part) {
  'worklet';
  stage.world.fx = { ...part.fx, pop: [] };
  popAll(stage.world);
}

/** A bubble that hangs in place, drifting and breathing. */
function hover(stage: Stage, part: Part, radius: number, dt: number) {
  'worklet';
  const w = stage.world;
  w.time += dt;
  const b = w.bubbles[0] ?? add(stage, part, 0, 0, P.z, radius);
  const t = w.time + part.delay * 9;
  b.p.x = Math.sin(t * 0.7) * P.drift;
  b.p.y = Math.sin(t * 0.53 + 1.3) * P.drift;
  b.d.x = Math.sin(t * 1.5) * P.breath;
  b.d.y = -b.d.x;
  b.style = styleFor(part, stage.turn);
  // Random shrinks away between one style and the next.
  const c = Math.max(0, stage.clock);
  const changing = part.kind === 'bubble' && part.styles.length > 1;
  b.r = radius * (changing ? smooth(c / P.grow) * smooth((P.loop.bubble - c) / P.grow) : 1) + 0.001;
}

/** Moves one preview on by `seconds`. */
export function play(stage: Stage, part: Part, seconds: number) {
  'worklet';
  const dt = Math.min(seconds, TUNING.maxFrame);
  const w = stage.world;
  const { kind, box } = part;
  let before = stage.clock;
  stage.clock += dt;
  if (stage.clock >= P.loop[kind]) {
    stage.clock -= P.loop[kind];
    stage.turn++;
    before = -1e-6;
  }
  const now = stage.clock;
  const starts = before < 0 && now >= 0;
  const at = (t: number) => {
    'worklet';
    return before < t && now >= t;
  };

  if (kind === 'bubble') {
    hover(stage, part, P.radius.bubble, dt);
    return;
  }
  if (kind === 'glass') {
    if (at(P.act.glass)) {
      const a = stage.turn * 2.4;
      const x = Math.cos(a) * 0.4;
      const y = Math.sin(a) * 0.4 * box.hh;
      // The wave and the ring must agree on which glass they meet.
      const variant = ((stage.turn % 2) + 0.5) / 2;
      w.waves.push({ x, y, age: 0, strength: 1, variant });
      w.ripples.push({ p: { x, y, z: 0 }, axis: 'z', age: 0, strength: 0.5, variant });
    }
    // Ages the waves without moving the bubble, which hangs where `hover` puts it.
    const held = w.bubbles;
    w.bubbles = [];
    advance(w, box, part.feels, 1, dt);
    w.bubbles = held;
    hover(stage, part, P.radius.glass, 0);
    return;
  }

  if (kind === 'box' || kind === 'light') {
    if (w.bubbles.length === 0) {
      const b = add(stage, part, 0, 0, P.z, P.radius[kind]);
      b.v = { x: 0.34, y: 0.26, z: 0.4 };
    }
  } else if (kind === 'feel') {
    if (starts) beginHold(w, box, -0.2, 0.15, styleFor(part, stage.turn));
    if (at(P.act.feel) && w.held) {
      const held = w.held.bubble;
      const feel = part.feels[Math.floor(((held.id * 0.75488) % 1) * part.feels.length)]!;
      release(w, 1.1, -0.8, feel.speed);
    }
  } else if (kind === 'meet') {
    const r = P.radius.meet;
    if (starts) {
      add(stage, part, -0.62, 0.08, P.z, 0.001);
      add(stage, part, 0.62, -0.08, P.z, 0.001, 1);
    }
    if (now >= 0 && now < P.grow)
      for (const b of w.bubbles) b.r = Math.max(0.001, r * smooth(now / P.grow));
    if (at(P.grow))
      for (const b of w.bubbles) {
        b.r = r;
        b.v.x = b.p.x < 0 ? P.closing : -P.closing;
      }
  } else {
    const r = P.radius[kind];
    if (starts) {
      w.fx = part.fx;
      add(stage, part, 0, 0, P.z, 0.001);
    }
    if (now >= 0 && now < P.grow)
      for (const b of w.bubbles) b.r = Math.max(0.001, r * smooth(now / P.grow));
    if (at(P.grow)) for (const b of w.bubbles) b.r = r;
    if (kind === 'pop') {
      if (at(P.act.pop)) for (const b of [...w.bubbles]) popApart(w, b);
    } else {
      const tap = part.taps[stage.turn % part.taps.length]!;
      const since = now - P.act.tap;
      stage.finger = smooth((since + 0.3) / 0.3) * (1 - smooth((since - P.press) / 0.4));
      if (at(P.act.tap)) beginHold(w, box, 0, 0, styleFor(part, stage.turn + 1), tap.pops);
      if (at(P.act.tap + P.press) && w.held && !finishTap(w)) release(w, 0.9, -0.6, 1);
    }
  }
  if ((kind === 'feel' || kind === 'meet' || kind === 'pop' || kind === 'tap') && at(P.clear[kind]))
    clear(stage, part);
  advance(
    w,
    box,
    kind === 'feel' || kind === 'box' || kind === 'light' ? part.feels : [STILL_AIR],
    part.bounce,
    dt,
  );
}

/** Runs to the moment that shows the option best, for Reduce Motion. */
export function playToStill(stage: Stage, part: Part) {
  'worklet';
  const end = part.delay + P.still[part.kind];
  for (let t = 0; t < end; t += 1 / 60) play(stage, part, 1 / 60);
  stage.finger = 0;
}
