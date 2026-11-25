import {
  Skia,
  type SkCanvas,
  type SkPaint,
  type SkRuntimeEffect,
} from '@shopify/react-native-skia';
import type { Glass } from '@/config/glass';
import { TUNING } from '@/config/tuning';
import type { Wave } from '@/core/types';
import type { View } from './drawScene';

const COUNT = TUNING.glass.maxWaves;

/** Bends whatever is drawn beneath it. Works in device pixels. */
const SKSL = `
uniform shader image;
uniform float2 low;
uniform float2 high;
uniform float2 centre;
uniform float ppu;
uniform float bend;
uniform float prism;
uniform float sheen;
uniform float4 waves[${COUNT}]; // x, y, age, strength

half4 main(float2 xy) {
  float2 q = (xy - centre) / ppu;
  float2 push = float2(0.0);
  for (int i = 0; i < ${COUNT}; i++) {
    float4 w = waves[i];
    if (w.w > 0.0) {
      float2 to = q - w.xy;
      float d = length(to);
      float front = w.z * ${TUNING.glass.speed.toFixed(3)};
      float behind = front - d;
      // A soft leading edge with a few fading rings in its wake.
      float shape = smoothstep(-0.16, 0.08, behind) * exp(-max(behind, 0.0) * 2.4);
      float life = smoothstep(0.0, 0.1, w.z) * exp(-w.z * 0.7)
                 * (1.0 - smoothstep(${(TUNING.glass.seconds * 0.6).toFixed(3)}, ${TUNING.glass.seconds.toFixed(3)}, w.z));
      float amp = sin(behind * 15.0) * shape * life * w.w / (1.0 + d * 0.35);
      push += to / max(d, 0.001) * smoothstep(0.0, 0.09, d) * amp;
    }
  }
  float2 off = push * bend * ppu;
  float2 lo = low + 0.5;
  float2 hi = high - 0.5;
  half4 mid = image.eval(clamp(xy + off, lo, hi));
  half r = image.eval(clamp(xy + off * (1.0 - prism), lo, hi)).r;
  half b = image.eval(clamp(xy + off * (1.0 + prism), lo, hi)).b;
  half3 c = half3(r, mid.g, b);
  float light = dot(push, float2(-0.6, -0.8));
  c += half3(0.75, 0.88, 1.0) * half(max(light, 0.0) * sheen);
  c *= half(1.0 - max(-light, 0.0) * sheen);
  return half4(min(c, half3(1.0)), 1.0);
}
`;

export function compileGlass(): SkRuntimeEffect | null {
  try {
    return Skia.RuntimeEffect.Make(SKSL);
  } catch (e) {
    console.error('Glass failed to compile', e);
    return null;
  }
}

type Area = { x: number; y: number; width: number; height: number };

/** Points `paint` at a filter for the current waves. */
function aim(
  paint: SkPaint,
  effect: SkRuntimeEffect,
  waves: Wave[],
  glass: Glass,
  v: View,
  pd: number,
  area: Area,
) {
  'worklet';
  const flat: number[] = [];
  for (let i = 0; i < COUNT; i++) {
    const w = waves[i];
    if (w) flat.push(w.x, w.y, w.age, w.strength);
    else flat.push(0, 0, 0, 0);
  }
  const b = Skia.RuntimeShaderBuilder(effect);
  b.setUniform('low', [area.x * pd, area.y * pd]);
  b.setUniform('high', [(area.x + area.width) * pd, (area.y + area.height) * pd]);
  b.setUniform('centre', [v.cx * pd, v.cy * pd]);
  b.setUniform('ppu', [v.ppu * pd]);
  b.setUniform('bend', [glass.bend]);
  b.setUniform('prism', [glass.prism]);
  b.setUniform('sheen', [glass.sheen]);
  b.setUniform('waves', flat);
  paint.setImageFilter(Skia.ImageFilter.MakeRuntimeShader(b, null, null));
}

/** Draws `content` through rippling glass. `area` is what it covers, normally the whole view. */
export function throughGlass(
  canvas: SkCanvas,
  paint: SkPaint,
  effect: SkRuntimeEffect,
  waves: Wave[],
  glass: Glass,
  view: View,
  pixelDensity: number,
  content: () => void,
  area: Area = { x: 0, y: 0, width: view.cx * 2, height: view.cy * 2 },
) {
  'worklet';
  aim(paint, effect, waves, glass, view, pixelDensity, area);
  canvas.save();
  // Skia runs these filters at scale 1, so the layer is made in device pixels to stay sharp.
  canvas.scale(1 / pixelDensity, 1 / pixelDensity);
  canvas.saveLayer(paint);
  canvas.scale(pixelDensity, pixelDensity);
  content();
  canvas.restore();
  canvas.restore();
}
