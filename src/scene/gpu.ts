import { BlendMode, Skia } from '@shopify/react-native-skia';
import { compileFx, compileStyles } from './effects';
import { compileGlass } from './glassFilter';

function make() {
  const ripplePaint = Skia.Paint();
  ripplePaint.setAntiAlias(true);
  const burstPaint = Skia.Paint();
  burstPaint.setBlendMode(BlendMode.Plus);
  return {
    fx: compileStyles(),
    burstFx: compileFx(),
    burstPaint,
    glassEffect: compileGlass(),
    glassPaint: Skia.Paint(),
    bubblePaint: Skia.Paint(),
    ripplePaint,
  };
}

let made: ReturnType<typeof make> | null = null;

/** Shaders and paints, compiled once and shared by the room and the picker. */
export const getGpu = () => (made ??= make());
