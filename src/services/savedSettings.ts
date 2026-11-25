import { File, Paths } from 'expo-file-system';
import { cleanSettings, cleanWalls, type Settings } from '@/config/defaults';
import type { Walls } from '@/config/environments';

type Saved = { settings: Settings; walls: Walls };

const clean = (data: unknown): Saved => ({
  settings: cleanSettings(data),
  walls: cleanWalls((data as { walls?: unknown } | null)?.walls),
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

export function saveSettings({ settings, walls }: Saved) {
  try {
    const f = file();
    if (!f.exists) f.create();
    f.write(JSON.stringify({ ...settings, walls }));
  } catch (e) {
    // Losing a preference should never interrupt play.
    console.warn('Settings were not saved', e);
  }
}
