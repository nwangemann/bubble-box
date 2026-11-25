import { ARENA_PULL } from '../config/pulls';
import { TUNING } from '../config/tuning';
import { ENTRANTS, type Rule } from '../config/rules';
import type { Box, World } from './types';
import { scaleAt } from './projection';
import { createWorld, newBubble } from './world';

function shuffled(n: number) {
  'worklet';
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = out[i]!;
    out[i] = out[j]!;
    out[j] = swap;
  }
  return out;
}

/**
 * A fresh showdown: entrants lined up, none touching and none twice. With fewer than the whole cast
 * of `cast`, who enters is random. A bubble's style is its cast number.
 */
export function createShowdown(box: Box, rule: Rule, count: number, cast = count) {
  'worklet';
  const S = TUNING.showdown;
  const world = createWorld();
  world.pulls = [ARENA_PULL];
  const entrants = shuffled(cast).slice(0, count);
  world.duel = {
    absorb: rule.absorb,
    grow: rule.grow,
    edge: rule.edge,
    phase: 'ready',
    seconds: 0,
    since: 0,
    clashes: [],
    entrants,
    log: [],
    out: 0,
    wins: {},
    ringing: {},
    sizes: {},
    champion: 0,
    favourite: 0,
    rage: false,
    hold: false,
  };
  const crowd = count > ENTRANTS.most;
  const columns = crowd ? S.crowd.columns : count < S.columns * 2 ? 2 : S.columns;
  const rows = Math.ceil(count / columns);
  const apart = crowd ? S.crowd.gap : Math.max(S.gap, (box.hh * 2 * S.spread) / rows);
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / columns);
    const col = i % columns;
    const across = Math.min(columns, count - row * columns);
    const x = ((col + 0.5) / across) * 2 - 1;
    // One depth for all, so perspective cannot make anyone look larger.
    const y = (row + 0.5 - rows / 2) * apart;
    const at = { x: x * box.hw, y, z: S.lineup };
    world.bubbles.push(newBubble(world, `${entrants[i]!}`, crowd ? S.crowd.radius : S.radius, at));
  }
  return world;
}

/** Roots for an entrant, or with 0 for none. The line-up stays long enough for it to be seen. */
export function choose(world: World, id: number, rage: boolean) {
  'worklet';
  const duel = world.duel;
  if (!duel || duel.phase !== 'ready') return;
  const S = TUNING.showdown;
  duel.favourite = id;
  duel.rage = id > 0 && rage;
  duel.seconds = Math.min(duel.seconds, S.ready - S.favourite.look);
}

/** Id of the entrant at a place on the screen, in half-widths from the middle, or 0. */
export function entrantAt(world: World, box: Box, x: number, y: number, reach: number) {
  'worklet';
  let best = 0;
  let least = Infinity;
  for (const b of world.bubbles) {
    const s = scaleAt(box, b.p.z);
    const d = Math.hypot(b.p.x * s - x, b.p.y * s - y);
    if (d > Math.max(reach, b.r * s * 1.2) || d >= least) continue;
    best = b.id;
    least = d;
  }
  return best;
}
