import { File, Paths } from 'expo-file-system';
import { cleanSettings, type Settings } from '@/config/defaults';

const file = () => new File(Paths.document, 'settings.json');

/** Reads at launch, so the first frame is already right. Anything unreadable becomes defaults. */
export function loadSettings(): Settings {
  try {
    const f = file();
    return cleanSettings(f.exists ? JSON.parse(f.textSync()) : null);
  } catch {
    return cleanSettings(null);
  }
}

export function saveSettings(settings: Settings) {
  try {
    const f = file();
    if (!f.exists) f.create();
    f.write(JSON.stringify(settings));
  } catch (e) {
    // Losing a preference should never interrupt play.
    console.warn('Settings were not saved', e);
  }
}
