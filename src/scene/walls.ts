import {
  Skia,
  type SkCanvas,
  type SkPaint,
  type SkRuntimeEffect,
} from '@shopify/react-native-skia';
import type { Environment, RoomLook, WallId } from '@/config/environments';
import { TUNING } from '@/config/tuning';
import type { Box, World } from '@/core/types';
import { heldBubbles } from '@/core/world';
import { CUSTOM, type CustomLook } from '@/config/custom';
import { STYLES, type BubbleStyle } from '@/styles';
import { LIB } from '@/styles/prelude';
import type { View } from './drawScene';

const LAMPS = TUNING.maxBubbles + 1;

/** Finds the wall behind a pixel: the perspective is simple enough to undo exactly. */
export const ROOM = `
uniform float2 centre;
uniform float ppu;
uniform float hw;
uniform float hh;
uniform float depth;
uniform float focal;

vec3 P;
vec3 N;
vec2 uv;
float face;
float corner;

void find(vec2 xy) {
  vec2 q = (xy - centre) / ppu;
  vec2 k2 = vec2(hw, hh) / max(abs(q), vec2(1e-4));
  float k = min(min(k2.x, k2.y), 1.0 + depth / focal);
  P = vec3(q * k, (k - 1.0) * focal);
  if (k == k2.x) {
    N = vec3(-sign(q.x), 0.0, 0.0);
    uv = P.zy;
    face = q.x < 0.0 ? 0.0 : 1.0;
    corner = min(hh - abs(P.y), depth - P.z);
  } else if (k == k2.y) {
    N = vec3(0.0, -sign(q.y), 0.0);
    uv = P.xz;
    face = q.y < 0.0 ? 2.0 : 3.0;
    corner = min(hw - abs(P.x), depth - P.z);
  } else {
    N = vec3(0.0, 0.0, -1.0);
    uv = P.xy;
    face = 4.0;
    corner = min(hw - abs(P.x), hh - abs(P.y));
  }
}
`;

/** Each supplies `vec4 wall()`: colour and opacity. `t` is the place on the wall, already softened. */
const MATERIALS: Record<WallId, string> = {
  frost: `
vec4 wall(vec2 t) {
  float g = fbm(t * 1.8);
  // Rime grows in from the corners with a ragged front.
  float front = 1.0 - smoothstep(-0.2, 1.1 + 0.4 * soft, corner - (g - 0.4) * 1.1);
  float fern = fbm(t * 7.0 + 2.0 * vec2(g, fbm(t * 3.0)));
  float crystal = mix(smoothstep(0.2, 0.95, fern), 0.45, soft * 0.8);
  float glint = pow(hash(floor(t * 90.0)), 40.0) * (1.0 - soft) * 0.35;
  return vec4(mix(ink, vec3(1.0), 0.35), 0.08 + 0.1 * g + front * (0.12 + 0.55 * crystal) + glint);
}`,
  water: `
vec4 wall(vec2 t) {
  float up = 0.5 - 0.5 * P.y / hh;
  float drift = fbm(t * vec2(0.9, 2.6));
  vec3 c = ink * mix(0.14, 0.62, up * up) + ink * 0.16 * (drift - 0.5) * (1.0 - soft * 0.7);
  return vec4(c, 0.62);
}`,
  silk: `
vec4 wall(vec2 t) {
  float f = t.x * 5.5 + 3.2 * fbm(t * vec2(0.8, 0.45));
  float fold = 0.5 + 0.5 * sin(f);
  fold = mix(fold, 0.5, soft * 0.6);
  float sheen = pow(fold, 5.0) * 0.28 + pow(1.0 - abs(2.0 * fold - 1.0), 9.0) * 0.05;
  float shade = mix(0.6, 1.0, smoothstep(0.0, 0.7, corner));
  return vec4((ink * (0.16 + 0.42 * fold) + sheen) * shade, 0.72);
}`,
  stone: `
vec4 wall(vec2 t) {
  float b = fbm(t * 2.1);
  float bump = noise(t * 3.6 + b * 1.5 + 0.14) - noise(t * 3.6 + b * 1.5 - 0.14);
  float speck = fbm(t * 19.0) - 0.5;
  float vein = pow(1.0 - abs(2.0 * fbm(t * 1.2 + b * 0.9) - 1.0), 16.0);
  float sharp = 1.0 - soft * 0.8;
  float lit = face == 3.0 ? 1.12 : face == 2.0 ? 0.72 : face == 4.0 ? 1.0 : 0.86;
  vec3 c = ink * (0.2 + 0.3 * mix(b, 0.5, soft * 0.6) + bump * 0.2 * sharp + speck * 0.16 * sharp) + ink * vein * 0.16 * sharp;
  return vec4(c * lit * mix(0.55, 1.0, smoothstep(0.0, 0.8, corner)), 0.92);
}`,
};

const materialSource = (wall: string) => `
${ROOM}
uniform float3 ink;
uniform float opacity;
uniform float soft;
${LIB}
${wall}
half4 main(vec2 xy) {
  find(xy);
  vec4 c = wall(uv * (1.0 - 0.45 * soft) + face * 7.3);
  float a = clamp(c.a * opacity, 0.0, 1.0);
  float grain = (hash(xy) - 0.5) / 200.0;
  return half4(half3(clamp(c.rgb + grain, 0.0, 1.0) * a), half(a));
}
`;

/** Light on the walls: from glowing bubbles, and the moving net of light in water. */
const LIGHT = `
${ROOM}
uniform float time;
uniform float wet;
uniform float lit;
uniform float soft;
uniform float4 lamps[${LAMPS}]; // place, power
uniform float4 tints[${LAMPS}];
${LIB}
half4 main(vec2 xy) {
  find(xy);
  vec3 c = vec3(0.0);
  for (int i = 0; i < ${LAMPS}; i++) {
    float4 l = lamps[i];
    if (l.w > 0.0) {
      vec3 to = l.xyz - P;
      float d2 = dot(to, to);
      float facing = max(dot(N, to) / sqrt(d2 + 1e-4), 0.0);
      c += tints[i].rgb * l.w * mix(facing, 1.0, 0.3 * soft) / (0.16 + d2 * 1.5);
    }
  }
  c *= lit;
  if (wet > 0.0) {
    vec2 w = uv * 1.5 + face * 3.1;
    w += 0.5 * vec2(noise(w + time * 0.22), noise(w.yx - time * 0.19));
    float net = 1.0 - abs(2.0 * noise(w * 1.7 + time * 0.12) - 1.0);
    float net2 = 1.0 - abs(2.0 * noise(w * 2.1 - time * 0.1 + 5.0) - 1.0);
    float up = 0.5 - 0.5 * P.y / hh;
    c += vec3(0.5, 0.9, 1.0) * wet * pow(net * net2, mix(6.0, 3.0, soft)) * mix(0.14, 0.36, up);
  }
  c = 1.0 - exp(-c);
  c = max(c + (hash(xy) - 0.5) / 160.0 * step(0.004, max(c.r, max(c.g, c.b))), 0.0);
  return half4(half3(c), half(max(c.r, max(c.g, c.b))));
}
`;

export function compile(name: string, sksl: string): SkRuntimeEffect | null {
  try {
    const effect = Skia.RuntimeEffect.Make(sksl);
    if (!effect) console.error(`${name} failed to compile`);
    return effect;
  } catch (e) {
    console.error(`${name} failed to compile`, e);
    return null;
  }
}

export const compileWalls = () => ({
  light: compile('wall light', LIGHT),
  materials: Object.fromEntries(
    Object.entries(MATERIALS).map(([id, sksl]) => [id, compile(id, materialSource(sksl))]),
  ) as Record<WallId, SkRuntimeEffect | null>,
});

/** Draws the wall material over the backdrop, if the box has one. */
export function drawMaterial(
  canvas: SkCanvas,
  materials: Record<WallId, SkRuntimeEffect | null>,
  box: Box,
  view: View,
  env: RoomLook,
) {
  const effect = env.wall ? materials[env.wall] : null;
  if (!effect) return;
  const paint = Skia.Paint();
  const [r, g, b] = env.ink;
  paint.setShader(
    effect.makeShader([
      view.cx,
      view.cy,
      view.ppu,
      box.hw,
      box.hh,
      box.depth,
      box.focal,
      r / 255,
      g / 255,
      b / 255,
      env.wallOpacity,
      env.softness,
    ]),
  );
  canvas.drawRect({ x: 0, y: 0, width: view.cx * 2, height: view.cy * 2 }, paint);
}

/** Plain data the UI thread can hold. */
const GLOWS = Object.fromEntries(
  (Object.entries(STYLES) as [string, BubbleStyle][]).map(([id, s]) => [
    id,
    { glow: s.glow ?? 0, tint: [...s.tint] },
  ]),
);

/** Lights the walls. Runs only with a glowing bubble or water. */
export function drawWallLight(
  canvas: SkCanvas,
  paint: SkPaint,
  effect: SkRuntimeEffect | null,
  world: World,
  box: Box,
  view: View,
  env: Environment,
  time: number,
  mine: CustomLook,
) {
  'worklet';
  if (!effect) return;
  const lamps: number[] = [];
  const tints: number[] = [];
  const all = [...world.bubbles, ...heldBubbles(world)];
  for (const b of all) {
    const g = GLOWS[b.style];
    if (!g || g.glow === 0 || lamps.length >= LAMPS * 4) continue;
    const alive = b.popping < 0 ? 1 : Math.max(0, 1 - b.popping / TUNING.popSeconds);
    lamps.push(b.p.x, b.p.y, b.p.z, g.glow * b.r * TUNING.walls.glow * alive * b.fade);
    const tint = b.style === CUSTOM ? mine.tint : g.tint;
    tints.push(tint[0]!, tint[1]!, tint[2]!, 1);
  }
  const wet = env.wall === 'water' ? Math.min(1, env.wallOpacity) : 0;
  if (wet === 0 && (lamps.length === 0 || env.lit === 0)) return;
  while (lamps.length < LAMPS * 4) lamps.push(0);
  while (tints.length < LAMPS * 4) tints.push(0);
  paint.setShader(
    effect.makeShader([
      view.cx,
      view.cy,
      view.ppu,
      box.hw,
      box.hh,
      box.depth,
      box.focal,
      time,
      wet,
      env.lit,
      env.softness,
      ...lamps,
      ...tints,
    ]),
  );
  const w = box.hw * view.ppu;
  const h = box.hh * view.ppu;
  canvas.drawRect({ x: view.cx - w, y: view.cy - h, width: w * 2, height: h * 2 }, paint);
}
