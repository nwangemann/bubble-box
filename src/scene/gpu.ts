import { BlendMode, Skia } from '@shopify/react-native-skia';
import { compileFx, compileStyles } from './effects';
import { compileGlass } from './glassFilter';
import { compileLiquid } from './liquid';
import { compileRoomContact } from './roomContact';
import { compileTrails } from './trails';
import { compileWalls } from './walls';

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
    liquid: compileLiquid(),
    roomContact: compileRoomContact(),
    trails: compileTrails(),
    walls: compileWalls(),
    lightPaint: Skia.Paint(),
  };
}

let made: ReturnType<typeof make> | null = null;

/** Shaders and paints, compiled once and shared by the room and the picker. */
export const getGpu = () => (made ??= make());
