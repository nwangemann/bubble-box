import { ARENA_PULL } from '../config/pulls';
import { TUNING } from '../config/tuning';
import type { Rule } from '../config/rules';
import type { Box } from './types';
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
  };
  const columns = count < S.columns * 2 ? 2 : S.columns;
  const rows = Math.ceil(count / columns);
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / columns);
    const col = i % columns;
    const across = Math.min(columns, count - row * columns);
    const x = ((col + 0.5) / across) * 2 - 1;
    // One depth for all, so perspective cannot make anyone look larger.
    const y = (row + 0.5 - rows / 2) * Math.max(S.gap, (box.hh * 2 * S.spread) / rows);
    const at = { x: x * box.hw, y, z: S.lineup };
    world.bubbles.push(newBubble(world, `${entrants[i]!}`, S.radius, at));
  }
  return world;
}
