/**
 * The rules of true 8-ball, as settled in docs/pool.md, Rules. Two players on one phone, taking turns.
 */
export const POOL_RULES = {
  /**
   * An 8 potted before its owner's group is cleared: `spot` sets it back as a foul (this table's
   * rule), `lose` loses the game (WPA 4.8b). The switch to revert if play asks for it.
   */
  earlyEight: 'spot' as 'spot' | 'lose',
  /** Shots that may pot nothing in a visit after the opponent's foul; otherwise one. */
  foulShots: 2,
  /**
   * After the break, a shot that has run `after` seconds slows `drag` times as hard, back to plain
   * drag once all have stopped. The break keeps plain drag: its pots come late.
   */
  hurry: { after: 3, drag: 4 },
  /** Searching for where a cue ball fits: steps outwards, and directions at each. */
  fit: { step: 0.02, most: 200, ways: 24 },
};
