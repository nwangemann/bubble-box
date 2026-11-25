import { cleanCustom, type Custom } from '@/config/custom';
import { cleanPool, type PoolSettings } from '@/config/poolOptions';
import { cleanCount, cleanRule, type RuleId } from '@/config/rules';
import { cleanSettings, cleanWalls, type Settings } from '@/config/defaults';
import { cleanTally, type Tally } from '@/config/tally';
import type { Walls } from '@/config/environments';
import { cleanCast, type CastChoice } from '@/showdown/casts';
import { read, write } from './store';

type Saved = {
  settings: Settings;
  walls: Walls;
  custom: Custom;
  rule: RuleId;
  count: number;
  cast: CastChoice;
  tally: Tally;
  pool: PoolSettings;
  /** The first-time hint is no longer needed. */
  hinted: boolean;
};

const clean = (data: unknown): Saved => ({
  settings: cleanSettings(data),
  walls: cleanWalls((data as { walls?: unknown } | null)?.walls),
  custom: cleanCustom((data as { custom?: unknown } | null)?.custom),
  rule: cleanRule((data as { rule?: unknown } | null)?.rule),
  count: cleanCount((data as { count?: unknown } | null)?.count),
  cast: cleanCast((data as { cast?: unknown } | null)?.cast),
  tally: cleanTally((data as { tally?: unknown } | null)?.tally),
  pool: cleanPool((data as { pool?: unknown } | null)?.pool),
  hinted: (data as { hinted?: unknown } | null)?.hinted === true,
});

/** Reads at launch, so the first frame is already right. Anything unreadable becomes defaults. */
export function loadSettings(): Saved {
  try {
    const text = read();
    return clean(text === null ? null : JSON.parse(text));
  } catch {
    return clean(null);
  }
}

export function saveSettings({ settings, ...rest }: Saved) {
  try {
    write(JSON.stringify({ ...settings, ...rest }));
  } catch (e) {
    // Losing a preference should never interrupt play.
    console.warn('Settings were not saved', e);
  }
}
