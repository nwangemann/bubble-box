import {
  Skia,
  type SkCanvas,
  type SkPaint,
  type SkRuntimeEffect,
} from '@shopify/react-native-skia';
import { FX, QUIET, type Fx } from '@/fx';
import { TUNING } from '@/config/tuning';
import type { Environment } from '@/config/environments';
import { STYLES, type StyleId } from '@/styles';
import { scaleAt } from '@/core/projection';
import { heldBubbles } from '@/core/world';
import type { Box, Bubble, Burst, Ripple, World } from '@/core/types';

export type Effects = Record<string, SkRuntimeEffect>;
export type View = { cx: number; cy: number; ppu: number };

const HALO = 1.5;
const RING_POINTS = 48;
const PLAIN = FX.film.body;
/** Plain data the UI thread can hold; shader text stays behind. */
const FX_LOOK = Object.fromEntries(
  (Object.entries(FX) as [string, Fx][]).map(([id, f]) => [
    id,
    { life: f.life, reach: f.reach, flat: f.flat, body: f.body ?? PLAIN },
  ]),
);
const TINTS = Object.fromEntries(
  (Object.keys(STYLES) as StyleId[]).map((id) => [id, [...STYLES[id].tint]]),
) as Record<string, number[]>;
const WHITE = [1, 1, 1];

function drawBubble(
  canvas: SkCanvas,
  paint: SkPaint,
  fx: Effects,
  b: Bubble,
  w: World,
  box: Box,
  v: View,
) {
  'worklet';
  const effect = fx[b.style];
  if (!effect) return;
  const s = scaleAt(box, b.p.z) * v.ppu;
  const pop = b.popping < 0 ? 0 : b.popping / TUNING.popSeconds;
  const body = FX_LOOK[b.popFx]?.body ?? QUIET;
  // Falls inwards gathering speed, or swells steadily.
  const swell = Math.max(0.01, 1 + body.swell * (body.swell < 0 ? pop * pop : pop));
  const gone = Math.min(1, pop * body.haste);
  // Squash along z shows as the disc growing or shrinking.
  const rx = b.r * s * swell * (1 + b.d.x - b.d.z * 0.3);
  const ry = b.r * s * swell * (1 + b.d.y - b.d.z * 0.3);
  const born = Math.min(1, b.r / 0.09);
  const shader = effect.makeShader([
    w.time,
    b.seed,
    1 / Math.max(1, Math.min(rx, ry) * 2),
    born * (1 - gone * gone),
    body.tear ? gone : 0,
    b.p.z / box.depth,
    b.turn,
  ]);
  paint.setShader(shader);
  canvas.save();
  canvas.translate(v.cx + b.p.x * s, v.cy + b.p.y * s);
  canvas.scale(rx, ry);
  canvas.drawRect({ x: -HALO, y: -HALO, width: HALO * 2, height: HALO * 2 }, paint);
  canvas.restore();
}

function drawBurst(canvas: SkCanvas, paint: SkPaint, fx: Effects, o: Burst, box: Box, v: View) {
  'worklet';
  const effect = fx[o.fx];
  const look = FX_LOOK[o.fx];
  if (!effect || !look) return;
  const s = scaleAt(box, o.p.z) * v.ppu;
  const radius = (0.12 + o.size) * look.reach * s;
  const dir = Math.atan2(o.n.y, o.n.x);
  // Seen from the side, the plane of contact narrows along the normal.
  const narrow = 1 - look.flat * (1 - Math.abs(o.n.z));
  const a = TINTS[o.styleA] ?? WHITE;
  const b = TINTS[o.styleB] ?? WHITE;
  paint.setShader(
    effect.makeShader([
      Math.min(1, o.age / look.life),
      o.seed,
      o.strength,
      o.spin,
      dir,
      1 / Math.max(1, radius),
      a[0]!,
      a[1]!,
      a[2]!,
      b[0]!,
      b[1]!,
      b[2]!,
    ]),
  );
  canvas.save();
  canvas.translate(v.cx + o.p.x * s, v.cy + o.p.y * s);
  canvas.rotate((dir * 180) / Math.PI, 0, 0);
  canvas.scale(radius * narrow, radius);
  canvas.drawRect({ x: -1, y: -1, width: 2, height: 2 }, paint);
  canvas.restore();
}

function drawRipple(
  canvas: SkCanvas,
  paint: SkPaint,
  r: Ripple,
  box: Box,
  v: View,
  env: Environment,
) {
  'worklet';
  const t = r.age / TUNING.rippleSeconds;
  const radius = 0.08 + (1 - Math.pow(1 - t, 3)) * (0.35 + r.strength * 0.7);
  const alpha = env.rippleOpacity * Math.pow(1 - t, 2) * (0.35 + r.strength * 0.65);
  const points = [];
  for (let i = 0; i < RING_POINTS; i++) {
    const a = (i / RING_POINTS) * Math.PI * 2;
    const c = Math.cos(a) * radius;
    const d = Math.sin(a) * radius;
    // The ring lies in the wall and stops at the wall's edges.
    const x = Math.max(-box.hw, Math.min(box.hw, r.p.x + (r.axis === 'x' ? 0 : c)));
    const y = Math.max(
      -box.hh,
      Math.min(box.hh, r.p.y + (r.axis === 'y' ? 0 : r.axis === 'x' ? c : d)),
    );
    const z = Math.max(0, Math.min(box.depth, r.p.z + (r.axis === 'z' ? 0 : d)));
    const s = scaleAt(box, z) * v.ppu;
    points.push({ x: v.cx + x * s, y: v.cy + y * s });
  }
  const path = Skia.Path.Polygon(points, true);
  const [cr, cg, cb] = env.ink;
  paint.setStyle(0);
  paint.setColor(Float32Array.of(cr / 255, cg / 255, cb / 255, alpha * 0.22));
  canvas.drawPath(path, paint);
  paint.setStyle(1);
  paint.setStrokeWidth(1.2);
  paint.setColor(Float32Array.of(cr / 255, cg / 255, cb / 255, alpha));
  canvas.drawPath(path, paint);
}

export function drawScene(
  canvas: SkCanvas,
  bubblePaint: SkPaint,
  ripplePaint: SkPaint,
  burstPaint: SkPaint,
  fx: Effects,
  burstFx: Effects,
  world: World,
  box: Box,
  view: View,
  env: Environment,
  /** For each glass in play, whether it bends. */
  bends: boolean[],
) {
  'worklet';
  for (const r of world.ripples) {
    // Bending glass replaces the drawn ring on the screen side.
    if (bends[Math.floor(r.variant * bends.length)] && r.axis === 'z' && r.p.z === 0) continue;
    drawRipple(canvas, ripplePaint, r, box, view, env);
  }
  const all = [...world.bubbles, ...heldBubbles(world)];
  all.sort((a, b) => b.p.z - a.p.z);
  for (const b of all) drawBubble(canvas, bubblePaint, fx, b, world, box, view);
  for (const o of world.bursts) drawBurst(canvas, burstPaint, burstFx, o, box, view);
}
