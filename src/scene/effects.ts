import { Skia } from '@shopify/react-native-skia';
import { FX } from '@/fx';
import { FX_HEAD, FX_LIB, FX_MAIN } from '@/fx/shell';
import { STYLES } from '@/styles';
import { LIB, MAIN, PRELUDE, SKIN } from '@/styles/prelude';
import type { Effects } from './drawScene';

/** Compiles every shader once. One that fails is reported and skipped. */
function compile(sources: [string, string][]): Effects {
  const out: Effects = {};
  for (const [id, sksl] of sources) {
    try {
      const effect = Skia.RuntimeEffect.Make(sksl);
      if (effect) out[id] = effect;
      else console.error(`${id} failed to compile`);
    } catch (e) {
      console.error(`${id} failed to compile`, e);
    }
  }
  return out;
}

export const compileStyles = () =>
  compile(Object.entries(STYLES).map(([id, s]) => [id, PRELUDE + LIB + SKIN + s.sksl + MAIN]));

export const compileFx = () =>
  compile(
    Object.entries(FX).flatMap(([id, f]) =>
      f.sksl ? [[id, FX_HEAD + LIB + FX_LIB + f.sksl + FX_MAIN] as [string, string]] : [],
    ),
  );
