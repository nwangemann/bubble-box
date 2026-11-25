/** What the showdown calls for a feat to be noticed. Few entrants make everything common. */
export const FEAT = {
  least: 6,
  /** Share of all knock-outs; knock-outs in a row; how many times wider the last rival was. */
  army: 0.8,
  streak: 5,
  giant: 2.5,
  /** Share already out before the winner's first knock-out. */
  late: 0.8,
  /** Seconds of fighting. Much the same however many enter. */
  quick: 8,
  slow: 20,
};

/** Titles for unusual wins, shared by every arena. All that fit are given, stacked in this order. */
export const FEATS = {
  army: 'One-Bubble Army',
  quick: 'Blink and You Missed It',
  slow: 'The Long Simmer',
  giant: 'Giant Popper',
  late: 'Fashionably Late',
  lone: 'Last Second Hero',
  streak: 'On a Roll',
  first: 'Start to Finish',
};
export type FeatId = keyof typeof FEATS;
export const FEAT_IDS = Object.keys(FEATS) as FeatId[];
