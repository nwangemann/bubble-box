import { File, Paths } from 'expo-file-system';
import { cleanCustom, type Custom } from '@/config/custom';
import { cleanCount, cleanRule, type RuleId } from '@/config/rules';
import { cleanSettings, cleanWalls, type Settings } from '@/config/defaults';
import type { Walls } from '@/config/environments';
import { cleanCast, type CastChoice } from '@/showdown/casts';

type Saved = {
  settings: Settings;
  walls: Walls;
  custom: Custom;
  rule: RuleId;
  count: number;
  cast: CastChoice;
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
  hinted: (data as { hinted?: unknown } | null)?.hinted === true,
});

const file = () => new File(Paths.document, 'settings.json');

/** Reads at launch, so the first frame is already right. Anything unreadable becomes defaults. */
export function loadSettings(): Saved {
  try {
    const f = file();
    return clean(f.exists ? JSON.parse(f.textSync()) : null);
  } catch {
    return clean(null);
  }
}

export function saveSettings({ settings, walls, custom, rule, count, cast, hinted }: Saved) {
  try {
    const f = file();
    if (!f.exists) f.create();
    f.write(JSON.stringify({ ...settings, walls, custom, rule, count, cast, hinted }));
  } catch (e) {
    // Losing a preference should never interrupt play.
    console.warn('Settings were not saved', e);
  }
}
