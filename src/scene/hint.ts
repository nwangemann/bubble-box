import {
  Skia,
  type SkCanvas,
  type SkPaint,
  type SkRuntimeEffect,
} from '@shopify/react-native-skia';
import { TUNING } from '@/config/tuning';
import { hintPose, type Hint } from '@/core/hint';
import type { View } from './drawScene';

/** Two soft fingertips side by side, each with a wake that thins towards where it set off. */
const SKSL = `
uniform float2 tip;
uniform float2 tail;
uniform float apart;
uniform float r;
uniform float4 ink;

float finger(float2 p) {
  float d = length(p - tip);
  float pad = (1.0 - smoothstep(0.0, r, d)) * 0.3 + (1.0 - smoothstep(r - 1.5, r, d)) * 0.16;
  float ring = exp(-pow((d - r) / max(1.2, r * 0.07), 2.0)) * 0.3;
  float glow = exp(-max(0.0, d - r) / (r * 0.35)) * 0.12;
  float2 way = tip - tail;
  float len = length(way);
  float wake = 0.0;
  if (len > 0.5) {
    float u = clamp(dot(p - tail, way) / (len * len), 0.0, 1.0);
    float wide = r * mix(0.25, 0.95, u);
    wake = (1.0 - smoothstep(wide * 0.2, wide, length(p - tail - way * u))) * pow(u, 1.4) * 0.6;
    wake *= smoothstep(r * 0.8, r * 1.05, d);
  }
  return pad + ring + glow * smoothstep(r - 1.0, r, d) + wake;
}

half4 main(float2 p) {
  float2 side = float2(apart / 2.0, 0.0);
  float a = min(0.9, finger(p - side) + finger(p + side)) * ink.a;
  return half4(half3(ink.rgb) * half(a), half(a));
}`;

export function compileHint() {
  try {
    const effect = Skia.RuntimeEffect.Make(SKSL);
    if (!effect) console.error('Hint failed to compile');
    return effect;
  } catch (e) {
    console.error('Hint failed to compile', e);
    return null;
  }
}

/** Draws the hint over everything, in the box's ink. */
export function drawHint(
  canvas: SkCanvas,
  paint: SkPaint,
  effect: SkRuntimeEffect | null,
  hint: Hint,
  v: View,
  ink: readonly number[],
  calm: boolean,
) {
  'worklet';
  if (!effect || hint.age < 0) return;
  const H = TUNING.hint;
  const { tip, tail, alpha } = hintPose(hint, calm);
  if (alpha <= 0) return;
  const x = v.cx + hint.x * v.ppu;
  // Upwards: 0 is where the stroke starts, 1 where it ends.
  const at = (along: number) => {
    'worklet';
    return v.cy + (hint.y + H.travel * (0.5 - along)) * v.ppu;
  };
  const apart = H.gap * v.ppu;
  const r = H.radius * v.ppu;
  const [red, green, blue] = ink as [number, number, number];
  paint.setShader(
    effect.makeShader([
      x,
      at(tip),
      x,
      at(tail),
      apart,
      r,
      red / 255,
      green / 255,
      blue / 255,
      alpha * H.opacity,
    ]),
  );
  const edge = r * 3;
  canvas.drawRect(
    {
      x: x - apart / 2 - edge,
      y: at(tip) - edge,
      width: apart + edge * 2,
      height: at(tail) - at(tip) + edge * 2,
    },
    paint,
  );
}
