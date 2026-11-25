/** Who wins a clash in a showdown, and what it gains. Add an entry and it appears in the tray. */
export type Rule = {
  name: string;
  about: string;
  /** Whether the winner takes the loser in; otherwise it pops. */
  absorb: boolean;
  /** Multiplies the winner's width at each clash, until it reaches `TUNING.showdown.largest`. */
  grow: number;
  /** How far size sways the odds: 0 is always even, 1 is in proportion to volume, 1/3 to width. */
  edge: number;
};

export const RULES = {
  grow: {
    name: 'Absorb',
    about: 'The winner takes the loser in and doubles; size sways the odds',
    absorb: true,
    grow: 2,
    edge: 1 / 3,
  },
  even: {
    name: 'Pop',
    about: 'The loser pops, the winner doubles; every clash is even',
    absorb: false,
    grow: 2,
    edge: 0,
  },
} satisfies Record<string, Rule>;

/** How many enter, between these. No cast has more, so nobody appears twice. */
export const ENTRANTS = { least: 2, most: 12, usual: 12 };
export const cleanCount = (saved: unknown): number =>
  Number.isInteger(saved) &&
  (saved as number) >= ENTRANTS.least &&
  (saved as number) <= ENTRANTS.most
    ? (saved as number)
    : ENTRANTS.usual;

export type RuleId = keyof typeof RULES;
export const DEFAULT_RULE: RuleId = 'grow';
export const cleanRule = (saved: unknown): RuleId =>
  typeof saved === 'string' && Object.hasOwn(RULES, saved) ? (saved as RuleId) : DEFAULT_RULE;
