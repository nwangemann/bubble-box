import {
  BlendMode,
  Skia,
  VertexMode,
  type SkCanvas,
  type SkRuntimeEffect,
} from '@shopify/react-native-skia';
import { TRAILS, type TrailId, type TrailLook } from '@/config/trails';
import { TUNING } from '@/config/tuning';
import { scaleAt } from '@/core/projection';
import { imagesOf, pointAt } from '@/core/trail';
import type { Box, Bubble, Trail, TrailPoint, World } from '@/core/types';
import { LIB } from '@/styles/prelude';
import type { View } from './drawScene';

const T = TUNING.trail;

/**
 * A strip supplies `vec3 trail(float v, float k, float born)`: light at `v`, -1 to 1 across, when it
 * is `k` of the way through its life. `born` is when it was laid, so what uses it stays in place.
 * Images supply `vec3 image(vec2 p, float rim, float k, float born)`: light at `p`, -1 to 1 across,
 * with `rim` 0 at the middle and 1 at the edge.
 * Uniform order must match `drawPiece`.
 */
const HEAD = `
uniform float now;
uniform float life;
uniform float seed;
uniform float strength;
uniform float2 clear;
uniform float2 span;
uniform float2 fog;
uniform float3 tint;
`;

const FADE = `
half4 faded(vec3 c, float age) {
  float k = clamp(age / life, 0.0, 1.0);
  // Gone by the end of its life, and hidden where it would show inside its bubble.
  c *= strength * (1.0 - k) * (1.0 - k * 0.4) * smoothstep(clear.x, clear.y, age);
  float far = mix(fog.x, fog.y, clamp((age - span.x) / max(span.y - span.x, 0.0001), 0.0, 1.0));
  c = min(c * (1.0 - 0.6 * far), 1.0);
  return half4(c, max(c.r, max(c.g, c.b)));
}
`;

const STRIP = `
half4 main(vec2 q) {
  vec3 c = max(trail(q.y, clamp(q.x / life, 0.0, 1.0), now - q.x), 0.0);
  return faded(c * smoothstep(1.0, 0.55, abs(q.y)), q.x);
}
`;

const IMAGE = `
half4 main(vec2 p) {
  float d = length(p);
  if (d >= 1.0) return half4(0.0);
  float rim = 1.0 - sqrt(1.0 - d * d);
  vec3 c = max(image(p, rim, clamp(span.x / life, 0.0, 1.0), now - span.x), 0.0);
  return faded(c * smoothstep(1.0, 0.94, d), span.x);
}
`;

const SOURCES: Record<TrailId, string> = {
  // A sliver of soap film, thinnest where it has hung longest, brighter along its edges.
  ribbon: `
vec3 trail(float v, float k, float born) {
  float flow = noise(vec2(born * 2.2 + seed * 40.0, v * 1.3 + now * 0.25));
  float thick = 0.75 + 0.5 * flow + 0.22 * v + 0.35 * (1.0 - k) + 0.12 * sin(born * 1.7 + seed * 9.0);
  vec3 c = mix(film(thick), tint, 0.18);
  float edge = pow(abs(v), 3.0);
  return c * (0.36 + 1.3 * edge + 0.22 * flow);
}`,
  // A fine bright thread in a soft glow, with light that gathers here and there.
  light: `
vec3 trail(float v, float k, float born) {
  float pulse = 0.72 + 0.4 * noise(vec2(born * 3.1 + seed * 30.0, now * 0.35));
  float core = exp(-v * v * 110.0);
  float glow = exp(-abs(v) * 4.5);
  vec3 hot = mix(tint, vec3(1.0), 0.65);
  return (hot * core * (1.0 - 0.45 * k) + tint * glow * 0.42) * pulse;
}`,
  // What the eye keeps of a bubble: its rim, thinning to a ring as it goes.
  echo: `
vec3 image(vec2 p, float rim, float k, float born) {
  vec3 c = mix(film(0.7 + 0.6 * rim + 0.12 * born + seed), tint, 0.75);
  float ring = pow(rim, mix(1.6, 3.2, k));
  float lit = 0.25 * exp(-dot(p - vec2(-0.4, -0.48), p - vec2(-0.4, -0.48)) * 22.0);
  return c * (ring + 0.07 * (1.0 - k)) + lit * (1.0 - k);
}`,
};

/** Compiles looks once each, from `sources`. One that fails is reported and skipped. */
export function compileLooks(looks: Record<string, TrailLook>, sources: Record<string, string>) {
  const effects: Record<string, SkRuntimeEffect> = {};
  for (const [id, sksl] of Object.entries(sources)) {
    const effect = Skia.RuntimeEffect.Make(
      HEAD + LIB + FADE + sksl + (looks[id]!.gap ? IMAGE : STRIP),
    );
    if (effect) effects[id] = effect;
    else console.error(`${id} trail failed to compile`);
  }
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  return { effects, paint };
}

export const compileTrails = () => compileLooks(TRAILS, SOURCES);

export type TrailGpu = ReturnType<typeof compileLooks>;

/** Part of a trail, short enough to be drawn in order of depth. An image is a single point. */
export type Piece = { trail: Trail; points: TrailPoint[]; clear: number[]; z: number };

/** Cuts a trail into pieces, each sharing its end with the next. `b` is what still leads it. */
export function cutTrail(
  out: Piece[],
  trail: Trail,
  b: Pick<Bubble, 'p' | 'v' | 'r'> | undefined,
  time: number,
  box: Box,
) {
  'worklet';
  const points = [...trail.points];
  const last = points[points.length - 1];
  if (!last) return;
  const clear = [-1, 0];
  const shown = trail.look.shown ?? T.shown;
  if (b) {
    points.push(pointAt(b, last, box.focal, time));
    // How long ago it was last behind or before the bubble.
    let inner = 0;
    let outer = 0;
    let before = 0;
    for (let i = points.length - 2; i >= 0; i--) {
      const { p, t } = points[i]!;
      const age = time - t;
      const since = time - points[i + 1]!.t;
      // As seen: where that part of the trail appears beside its bubble.
      const k = scaleAt(box, p.z) / scaleAt(box, b.p.z);
      const away = Math.hypot(p.x * k - b.p.x, p.y * k - b.p.y) / b.r;
      const when = (edge: number) => {
        'worklet';
        return since + ((age - since) * (edge - before)) / Math.max(1e-6, away - before);
      };
      if (away < T.hidden) inner = age;
      else if (before < T.hidden) inner = when(T.hidden);
      outer = away < shown ? age : when(shown);
      if (away >= shown) break;
      before = away;
    }
    clear[0] = inner;
    clear[1] = Math.max(outer, inner + 0.01);
  }
  if (trail.look.gap) {
    for (const o of imagesOf(points, trail.look.gap)) {
      // Ones not yet showing, or already gone, cost nothing.
      const age = time - o.t;
      if (age > clear[0]! && age < trail.look.seconds)
        out.push({ trail, points: [o], clear, z: o.p.z });
    }
    return;
  }
  for (let from = 0; from < points.length - 1; from += T.piece) {
    // What is wholly hidden at its own bubble costs nothing.
    if (time - points[from]!.t <= clear[0]!) break;
    const part = points.slice(from, from + T.piece + 1);
    let z = 0;
    for (const o of part) z += o.p.z / part.length;
    out.push({ trail, points: part, clear, z });
  }
}

export function trailPieces(w: World, box: Box): Piece[] {
  'worklet';
  const out: Piece[] = [];
  for (const trail of w.trails) {
    const b = w.trailLooks.some((l) => l.id === trail.look.id)
      ? w.bubbles.find((o) => o.id === trail.bubble && o.popping < 0 && !o.join)
      : undefined;
    cutTrail(out, trail, b, w.time, box);
  }
  return out;
}

export function drawPiece(
  canvas: SkCanvas,
  gpu: TrailGpu,
  piece: Piece,
  time: number,
  box: Box,
  v: View,
  tint: number[],
) {
  'worklet';
  const { trail, points, clear } = piece;
  const { look } = trail;
  const effect = gpu.effects[look.id];
  if (!effect) return;
  const at = [];
  const on = [];
  for (const o of points) {
    const age = time - o.t;
    const s = scaleAt(box, o.p.z) * v.ppu;
    if (look.gap) {
      const half = o.r * look.width * (1 - (T.shrink * age) / look.seconds) * s;
      for (let i = 0; i < 4; i++) {
        const x = i % 2 === 0 ? -1 : 1;
        const y = i < 2 ? -1 : 1;
        at.push({ x: v.cx + o.p.x * s + x * half, y: v.cy + o.p.y * s + y * half });
        on.push({ x, y });
      }
      continue;
    }
    const left = Math.max(0, 1 - age / look.seconds);
    // Never thinner than can be drawn smoothly.
    const open = Math.sqrt(Math.min(1, (o.t - trail.born) / T.open));
    const half = Math.max(o.r * look.width * Math.pow(left, T.taper) * open, T.thinnest / s);
    for (let way = -1; way <= 1; way += 2) {
      const k = scaleAt(box, Math.max(0, o.p.z + o.side.z * half * way)) * v.ppu;
      at.push({
        x: v.cx + (o.p.x + o.side.x * half * way) * k,
        y: v.cy + (o.p.y + o.side.y * half * way) * k,
      });
      on.push({ x: age, y: way });
    }
  }
  const first = points[0]!;
  const last = points[points.length - 1]!;
  gpu.paint.setShader(
    effect.makeShader([
      time,
      look.seconds,
      trail.seed,
      look.strength,
      clear[0]!,
      clear[1]!,
      time - last.t,
      time - first.t,
      last.p.z / box.depth,
      first.p.z / box.depth,
      tint[0]!,
      tint[1]!,
      tint[2]!,
    ]),
  );
  const strip = Skia.MakeVertices(VertexMode.TriangleStrip, at, on);
  canvas.drawVertices(strip, BlendMode.SrcOver, gpu.paint);
}
