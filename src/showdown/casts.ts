import { THEME_IDS, THEMES, type ThemeId } from './index';

/** Whose cast fights: the arena's own, a new one each showdown, or always one theme's. */
export type CastChoice = 'own' | 'random' | ThemeId;

/** In the order the chooser steps through them. */
export const CAST_CHOICES: CastChoice[] = ['own', ...THEME_IDS, 'random'];

export const castName = (choice: CastChoice): string =>
  choice === 'own' ? 'Own cast' : choice === 'random' ? 'Random cast' : THEMES[choice].name;

/** Whose cast fights in an arena, settled once for each showdown. */
export function castFor(choice: CastChoice, arena: ThemeId): ThemeId {
  if (choice === 'own') return arena;
  if (choice !== 'random') return choice;
  return THEME_IDS[Math.floor(Math.random() * THEME_IDS.length)]!;
}

export const stepCast = (choice: CastChoice, by: number): CastChoice => {
  const n = CAST_CHOICES.length;
  return CAST_CHOICES[(CAST_CHOICES.indexOf(choice) + by + n) % n]!;
};

export const cleanCast = (saved: unknown): CastChoice =>
  CAST_CHOICES.find((c) => c === saved) ?? 'own';
