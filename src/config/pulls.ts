/** How bubbles draw each other. Add an entry and it appears in the tray. */
export type Pull = {
  name: string;
  /** Acceleration at the moment of touching. */
  strength: number;
  /** Gap between surfaces at which it begins. */
  reach: number;
  /** How far size sways it: 0 not at all, 1 in proportion to width. */
  heft: number;
};

export const PULLS = {
  near: { name: 'Near', strength: 1.5, reach: 0.6, heft: 0 },
  far: { name: 'Far', strength: 0.6, reach: 1.6, heft: 0 },
  heavy: { name: 'Heavy', strength: 0.9, reach: 1, heft: 1 },
} satisfies Record<string, Pull>;

export type PullId = keyof typeof PULLS;

/** How entrants draw each other in a showdown. Not in the tray. */
export const ARENA_PULL: Pull = { name: 'Arena', strength: 0.5, reach: 0.5, heft: 0.5 };
