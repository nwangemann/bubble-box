import { FEAT, FEAT_IDS, type FeatId } from '../config/feats';
import type { Duel } from './types';

/** Everything unusual about how the champion won. */
export function featsOf(duel: Duel): FeatId[] {
  'worklet';
  const { log, champion, entrants } = duel;
  const last = log[log.length - 1];
  if (!last || entrants.length < FEAT.least) return [];
  const wins = duel.wins[champion] ?? 0;
  let first = log.length;
  let run = 0;
  let streak = 0;
  for (let i = 0; i < log.length; i++) {
    const mine = log[i]!.winner === champion;
    run = mine ? run + 1 : 0;
    streak = Math.max(streak, run);
    if (mine) first = Math.min(first, i);
  }
  const fits: Record<FeatId, boolean> = {
    army: wins >= FEAT.army * log.length,
    quick: last.seconds <= FEAT.quick,
    slow: last.seconds >= FEAT.slow,
    giant: wins > 1 && last.odds >= FEAT.giant,
    late: wins > 1 && first >= FEAT.late * log.length,
    lone: wins === 1,
    streak: streak >= FEAT.streak,
    first: first === 0,
  };
  return FEAT_IDS.filter((id) => fits[id]);
}
