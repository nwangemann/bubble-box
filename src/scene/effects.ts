import { Skia } from '@shopify/react-native-skia';
import { STYLES } from '@/styles';
import { MAIN, PRELUDE } from '@/styles/prelude';
import type { Effects } from './drawScene';

/** Compiles every style once. A style that fails to compile is reported and skipped. */
export function compileEffects(): Effects {
  const out: Effects = {};
  for (const [id, style] of Object.entries(STYLES)) {
    try {
      const effect = Skia.RuntimeEffect.Make(PRELUDE + style.sksl + MAIN);
      if (effect) out[id] = effect;
      else console.error(`Style ${id} failed to compile`);
    } catch (e) {
      console.error(`Style ${id} failed to compile`, e);
    }
  }
  return out;
}
