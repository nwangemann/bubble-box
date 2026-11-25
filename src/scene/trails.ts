import {
  BlendMode,
  Skia,
  VertexMode,
  type SkCanvas,
  type SkRuntimeEffect,
} from '@shopify/react-native-skia';
import type { TrailId } from '@/config/trails';
import { TUNING } from '@/config/tuning';
import { scaleAt } from '@/core/projection';
import { sideOf } from '@/core/trail';
import type { Box, Bubble, Trail, TrailPoint, World } from '@/core/types';
import { LIB } from '@/styles/prelude';
import type { View } from './drawScene';

const T = TUNING.trail;

/**
 * A trail supplies `vec3 trail(float v, float k, float born)`: light at `v`, -1 to 1 across, when it
 * is `k` of the way through its life. `born` is when it was laid, so what uses it stays in place.
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

const MAIN = `
half4 main(vec2 q) {
  float k = clamp(q.x / life, 0.0, 1.0);
  vec3 c = max(trail(q.y, k, now - q.x), 0.0);
  c *= smoothstep(1.0, 0.55, abs(q.y));
  // Gone by the end of its life, and hidden where it would show inside its bubble.
  c *= strength * (1.0 - k) * (1.0 - k * 0.4) * smoothstep(clear.x, clear.y, q.x);
  float far = mix(fog.x, fog.y, clamp((q.x - span.x) / max(span.y - span.x, 0.0001), 0.0, 1.0));
  c = min(c * (1.0 - 0.6 * far), 1.0);
  return half4(c, max(c.r, max(c.g, c.b)));
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
};

/** Compiles every trail once. One that fails is reported and skipped. */
export function compileTrails() {
  const effects: Record<string, SkRuntimeEffect> = {};
  for (const [id, sksl] of Object.entries(SOURCES)) {
    const effect = Skia.RuntimeEffect.Make(HEAD + LIB + sksl + MAIN);
    if (effect) effects[id] = effect;
    else console.error(`${id} trail failed to compile`);
  }
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  return { effects, paint };
}

export type TrailGpu = ReturnType<typeof compileTrails>;

/** Part of a trail, short enough to be drawn in order of depth. */
export type Piece = { trail: Trail; points: TrailPoint[]; clear: number[]; z: number };

/** Cuts trails into pieces, each sharing its end with the next. */
export function trailPieces(w: World, box: Box): Piece[] {
  'worklet';
  const out: Piece[] = [];
  for (const trail of w.trails) {
    const b: Bubble | undefined = w.bubbles.find(
      (o) => o.id === trail.bubble && o.popping < 0 && !o.join,
    );
    const points = [...trail.points];
    const last = points[points.length - 1];
    if (!last) continue;
    const clear = [-1, 0];
    const leads = b && w.trailLooks.some((l) => l.id === trail.look.id);
    if (leads) {
      points.push({
        p: b.p,
        v: b.v,
        side: sideOf(b.p, b.v, last.side, box.focal),
        r: b.r,
        t: w.time,
      });
      // How long ago it was last behind or before the bubble.
      let inner = 0;
      let outer = 0;
      let before = 0;
      for (let i = points.length - 2; i >= 0; i--) {
        const { p, t } = points[i]!;
        const age = w.time - t;
        const since = w.time - points[i + 1]!.t;
        // As seen: where that part of the trail appears beside its bubble.
        const k = scaleAt(box, p.z) / scaleAt(box, b.p.z);
        const away = Math.hypot(p.x * k - b.p.x, p.y * k - b.p.y) / b.r;
        const when = (edge: number) => {
          'worklet';
          return since + ((age - since) * (edge - before)) / Math.max(1e-6, away - before);
        };
        if (away < T.hidden) inner = age;
        else if (before < T.hidden) inner = when(T.hidden);
        outer = away < T.shown ? age : when(T.shown);
        if (away >= T.shown) break;
        before = away;
      }
      clear[0] = inner;
      clear[1] = Math.max(outer, inner + 0.01);
    }
    for (let from = 0; from < points.length - 1; from += T.piece) {
      const part = points.slice(from, from + T.piece + 1);
      let z = 0;
      for (const o of part) z += o.p.z / part.length;
      out.push({ trail, points: part, clear, z });
    }
  }
  return out;
}

export function drawPiece(
  canvas: SkCanvas,
  gpu: TrailGpu,
  piece: Piece,
  w: World,
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
    const age = w.time - o.t;
    const s = scaleAt(box, o.p.z) * v.ppu;
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
      w.time,
      look.seconds,
      trail.seed,
      look.strength,
      clear[0]!,
      clear[1]!,
      w.time - last.t,
      w.time - first.t,
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
