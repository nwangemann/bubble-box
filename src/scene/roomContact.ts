import type { SkCanvas, SkPaint, SkRuntimeEffect } from '@shopify/react-native-skia';
import { AIR, ROOM_CONTACT } from '@/config/arena';
import { ENTRANTS } from '@/config/rules';
import type { Box } from '@/core/types';
import { LIB } from '@/styles/prelude';
import type { View } from './drawScene';
import { compile, ROOM } from './walls';

const MOST = ENTRANTS.mixed;

/**
 * Shadows, reflections and light on the room's walls, in one pass. Uniform order matches
 * `drawRoomContact`.
 */
const SKSL = `
${ROOM}
uniform float fall;
uniform float shadow;
uniform float spread;
uniform float touch;
uniform float light;
uniform float focus;
uniform float mirror;
uniform float3 air; // from, haze, dim
uniform float4 balls[${MOST}]; // place, radius
uniform float4 tints[${MOST}]; // colour, presence
${LIB}
half4 main(vec2 xy) {
  find(xy);
  vec3 ray = normalize(P - vec3(0.0, 0.0, -focal));
  float floorish = face == 3.0 ? 1.0 : 0.0;
  // A wall seen edge on mirrors more.
  float skim = 0.35 + 0.65 * pow(1.0 - abs(dot(ray, N)), 2.0);
  float dark = 0.0;
  vec3 c = vec3(0.0);
  for (int i = 0; i < ${MOST}; i++) {
    float4 b = balls[i];
    float4 t = tints[i];
    if (t.w > 0.0) {
      float r = b.w;
      vec3 to = b.xyz - P;
      float up = dot(to, N);
      float gap = max(up - r, 0.0);
      float near = clamp(1.0 - gap / (fall * r), 0.0, 1.0);
      near *= near * t.w;
      if (near > 0.0 || floorish > 0.0) {
        vec3 side = to - N * up;
        float d2 = dot(to, to);
        float far = sqrt(dot(side, side));
        float facing = r * r * max(up, 0.0) / (d2 * sqrt(d2) + 1e-4);
        // Darkest at the point of contact.
        float own = touch * near * smoothstep(0.75 * r, 0.0, far);
        // Straight down, from light above: wider and fainter with height.
        if (floorish > 0.0) {
          float high = clamp(1.0 - gap / (2.0 * hh), 0.0, 1.0);
          float wide = r + spread * gap;
          float share = r / wide;
          float under = smoothstep(wide * 1.1, wide * (0.75 * share), far) * share * high * t.w;
          own = max(own, shadow * under);
          c += t.rgb * focus * under * share * smoothstep(0.5 * wide, 0.0, far);
        }
        dark = 1.0 - (1.0 - dark) * (1.0 - own);
        c += t.rgb * light * near * facing;
        // The bubble as seen in the wall: a film, brightest at its rim, softer further from it.
        vec3 m = to - 2.0 * up * N;
        float along = dot(m, ray);
        float off = sqrt(max(dot(m, m) - along * along, 0.0)) / r;
        float blur = 0.1 + 0.25 * gap / r;
        float disc = 1.0 - smoothstep(1.0 - blur, 1.0 + blur, off);
        float rim = min(off, 1.0);
        c += mix(t.rgb, vec3(1.0), 0.25 * rim * rim) * mirror * skim * near * disc
           * (0.22 + 0.78 * rim * rim * rim);
      }
    }
  }
  // Through the same air as the bubbles.
  float away = clamp((P.z / depth - air.x) / (1.0 - air.x), 0.0, 1.0);
  float clear = 1.0 - air.y * away;
  c = 1.0 - exp(-c * clear * (1.0 - air.z * away));
  dark *= clear;
  float a = max(dark, max(c.r, max(c.g, c.b)));
  float grain = (hash(xy) - 0.5) / 160.0 * step(0.004, a);
  a = clamp(a + grain, 0.0, 1.0);
  return half4(half3(clamp(c + grain, vec3(0.0), vec3(a))), half(a));
}
`;

export const compileRoomContact = () => compile('room contact', SKSL);

/** A bubble as its room sees it. `presence` is 0 to 1. */
export type Touching = {
  x: number;
  y: number;
  z: number;
  r: number;
  tint: number[];
  presence: number;
};

export function drawRoomContact(
  canvas: SkCanvas,
  paint: SkPaint,
  effect: SkRuntimeEffect | null,
  all: Touching[],
  box: Box,
  v: View,
) {
  'worklet';
  if (!effect || all.length === 0) return;
  const balls: number[] = [];
  const tints: number[] = [];
  for (let i = 0; i < MOST; i++) {
    const b = all[i];
    if (b) {
      balls.push(b.x, b.y, b.z, Math.max(1e-3, b.r));
      tints.push(b.tint[0]!, b.tint[1]!, b.tint[2]!, b.presence);
    } else {
      balls.push(0, 0, 0, 1);
      tints.push(0, 0, 0, 0);
    }
  }
  const C = ROOM_CONTACT;
  paint.setShader(
    effect.makeShader([
      v.cx,
      v.cy,
      v.ppu,
      box.hw,
      box.hh,
      box.depth,
      box.focal,
      C.fall,
      C.shadow,
      C.spread,
      C.touch,
      C.light,
      C.focus,
      C.mirror,
      AIR.from,
      AIR.haze,
      AIR.dim,
      ...balls,
      ...tints,
    ]),
  );
  const w = box.hw * v.ppu;
  const h = box.hh * v.ppu;
  canvas.drawRect({ x: v.cx - w, y: v.cy - h, width: w * 2, height: h * 2 }, paint);
}
