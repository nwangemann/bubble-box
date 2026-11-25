import { CAST, ENTRANTS } from '../config/rules';
import { THEME_IDS, THEMES, type ThemeId } from './index';
import type { Cast, Fighter } from './types';

/** Whose cast fights in a showdown: one theme's, or some from every theme. */
export type CastId = ThemeId | 'mixed';

/** As chosen: the arena's own, a new one each showdown, or always the same. */
export type CastChoice = 'own' | 'random' | CastId;

/** In the order the chooser steps through them. */
export const CAST_CHOICES: CastChoice[] = ['own', ...THEME_IDS, 'random', 'mixed'];

const NAMES = { own: 'Own cast', random: 'Random cast', mixed: 'Mixed cast' };

export const castName = (choice: CastChoice): string =>
  choice === 'own' || choice === 'random' || choice === 'mixed'
    ? NAMES[choice]
    : THEMES[choice].name;

/** Whose cast fights in an arena, settled once for each showdown. Random is always one theme's. */
export function castFor(choice: CastChoice, arena: ThemeId): CastId {
  if (choice === 'own') return arena;
  if (choice !== 'random') return choice;
  return THEME_IDS[Math.floor(Math.random() * THEME_IDS.length)]!;
}

/** How many can enter. */
export const mostOf = (choice: CastChoice): number =>
  choice === 'mixed' ? ENTRANTS.mixed : ENTRANTS.most;

export const stepCast = (choice: CastChoice, by: number): CastChoice => {
  const n = CAST_CHOICES.length;
  return CAST_CHOICES[(CAST_CHOICES.indexOf(choice) + by + n) % n]!;
};

export const cleanCast = (saved: unknown): CastChoice =>
  CAST_CHOICES.find((c) => c === saved) ?? 'own';

/** One who may enter, and the cast they come from, which says what they do and are called. */
export type Member = { fighter: Fighter; home: Cast };

function shuffled<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Whether two are too near in colour to tell apart at a distance. */
export function alike(a: Fighter, b: Fighter) {
  const [p, q] = [rgb(a.skin[0]), rgb(b.skin[0])];
  return Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!) < CAST.alike;
}

/** A theme's whole cast, or `count` dealt evenly from every theme, no two alike in colour. */
export function crewOf(cast: CastId, count: number): Member[] {
  if (cast !== 'mixed') {
    const home = THEMES[cast];
    return home.cast.map((fighter) => ({ fighter, home }));
  }
  const hands = shuffled(THEME_IDS).map((id) => {
    const home: Cast = THEMES[id];
    return shuffled(home.cast).map((fighter): Member => ({ fighter, home }));
  });
  const crew: Member[] = [];
  while (crew.length < count && hands.some((h) => h.length > 0))
    for (const hand of hands) {
      if (crew.length >= count) break;
      let next = hand.pop();
      while (next && crew.some((m) => alike(m.fighter, next!.fighter))) next = hand.pop();
      if (next) crew.push(next);
    }
  return crew;
}
