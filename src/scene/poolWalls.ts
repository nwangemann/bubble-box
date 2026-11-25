import type { SkCanvas, SkPaint, SkRuntimeEffect } from '@shopify/react-native-skia';
import { POOL } from '@/config/pool';
import type { Ball } from '@/core/pool';
import type { Box } from '@/core/types';
import { LIB } from '@/styles/prelude';
import type { View } from './drawScene';
import { compile, ROOM } from './walls';

const MOST = POOL.looks.length;

/**
 * Where pool's balls are, marked on the walls: shadows straight across from each, and its light while
 * it moves. Uniform order matches `drawPoolWalls`.
 */
const SKSL = `
${ROOM}
uniform float reach;
uniform float shadow;
uniform float spread;
uniform float touch;
uniform float light;
uniform float lightReach;
uniform float haze;
uniform float4 balls[${MOST}]; // place, radius
uniform float4 tints[${MOST}]; // colour, how lively; negative when out of play
${LIB}
half4 main(vec2 xy) {
  find(xy);
  float back = face == 4.0 ? 1.0 : 0.0;
  // A shadow on the far wall is how deep a ball is, so it carries all the way.
  float carry = mix(reach, depth, back);
  float dark = 0.0;
  vec3 c = vec3(0.0);
  for (int i = 0; i < ${MOST}; i++) {
    float4 b = balls[i];
    float4 t = tints[i];
    if (t.w >= 0.0) {
      float r = b.w;
      vec3 to = b.xyz - P;
      float up = dot(to, N);
      vec3 side = to - N * up;
      float far = sqrt(dot(side, side));
      float gap = max(up - r, 0.0);
      float near = clamp(1.0 - gap / carry, 0.0, 1.0);
      // Wider, softer and fainter with distance.
      float wide = r + spread * gap;
      float share = r / wide;
      float own = shadow * near * mix(share, 1.0, 0.5) * smoothstep(wide * 1.05, wide * (0.9 * share), far);
      float press = clamp(1.0 - gap / (2.0 * r), 0.0, 1.0);
      own = max(own, touch * press * press * smoothstep(r, 0.0, far));
      dark = 1.0 - (1.0 - dark) * (1.0 - own);
      if (t.w > 0.0) {
        float lamp = clamp(1.0 - gap / lightReach, 0.0, 1.0);
        float d2 = dot(to, to);
        c += t.rgb * light * t.w * lamp * r * r * max(up, 0.0) / (d2 * sqrt(d2) + 1e-4);
      }
    }
  }
  float clear = 1.0 - haze * P.z / depth;
  c = 1.0 - exp(-c * clear);
  float a = max(dark, max(c.r, max(c.g, c.b)));
  float grain = (hash(xy) - 0.5) / 160.0 * step(0.004, a);
  a = clamp(a + grain, 0.0, 1.0);
  return half4(half3(clamp(c + grain, vec3(0.0), vec3(a))), half(a));
}
`;

export const compilePoolWalls = () => compile('pool walls', SKSL);

/** A ball's colour as light: even the 8 throws some. */
export const LIGHTS = POOL.looks.map(({ color }) =>
  color.map((c) => Math.max(c, POOL.walls.least)),
);

export function drawPoolWalls(
  canvas: SkCanvas,
  paint: SkPaint,
  effect: SkRuntimeEffect | null,
  all: Ball[],
  box: Box,
  v: View,
) {
  'worklet';
  if (!effect) return;
  const balls: number[] = [];
  const tints: number[] = [];
  for (let i = 0; i < MOST; i++) {
    const b = all[i];
    const t = LIGHTS[i]!;
    const here = b !== undefined && b.sunk < POOL.sink;
    // One that leaves takes its marks with it.
    const size = !here ? 1 : b.sunk < 0 ? b.r : Math.max(1e-3, b.r * (1 - b.sunk / POOL.sink));
    balls.push(here ? b.p.x : 0, here ? b.p.y : 0, here ? b.p.z : 0, size);
    tints.push(t[0]!, t[1]!, t[2]!, here ? b.lively : -1);
  }
  const W = POOL.walls;
  paint.setShader(
    effect.makeShader([
      v.cx,
      v.cy,
      v.ppu,
      box.hw,
      box.hh,
      box.depth,
      box.focal,
      W.reach,
      W.shadow,
      W.spread,
      W.touch,
      W.light,
      W.lightReach,
      W.haze,
      ...balls,
      ...tints,
    ]),
  );
  const w = box.hw * v.ppu;
  const h = box.hh * v.ppu;
  canvas.drawRect({ x: v.cx - w, y: v.cy - h, width: w * 2, height: h * 2 }, paint);
}
