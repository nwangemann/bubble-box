import {
  Skia,
  type SkCanvas,
  type SkPaint,
  type SkRuntimeEffect,
} from '@shopify/react-native-skia';
import { TUNING } from '@/config/tuning';
import type { Environment } from '@/config/environments';
import { scaleAt } from '@/core/projection';
import { mayBeTap } from '@/core/world';
import type { Box, Bubble, Ripple, World } from '@/core/types';

export type Effects = Record<string, SkRuntimeEffect>;
export type View = { cx: number; cy: number; ppu: number };

const HALO = 1.5;
const RING_POINTS = 48;

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
  const swell = 1 + pop * 0.12;
  // Squash along z shows as the disc growing or shrinking.
  const rx = b.r * s * swell * (1 + b.d.x - b.d.z * 0.3);
  const ry = b.r * s * swell * (1 + b.d.y - b.d.z * 0.3);
  const born = Math.min(1, b.r / 0.09);
  const shader = effect.makeShader([
    w.time,
    b.seed,
    1 / Math.max(1, Math.min(rx, ry) * 2),
    born * (1 - pop * pop),
    pop,
    b.p.z / box.depth,
  ]);
  paint.setShader(shader);
  canvas.save();
  canvas.translate(v.cx + b.p.x * s, v.cy + b.p.y * s);
  canvas.scale(rx, ry);
  canvas.drawRect({ x: -HALO, y: -HALO, width: HALO * 2, height: HALO * 2 }, paint);
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
  fx: Effects,
  world: World,
  box: Box,
  view: View,
  env: Environment,
  glassOn: boolean,
) {
  'worklet';
  for (const r of world.ripples) {
    // Bending glass replaces the drawn ring on the screen side.
    if (glassOn && r.axis === 'z' && r.p.z === 0) continue;
    drawRipple(canvas, ripplePaint, r, box, view, env);
  }
  const all =
    world.held && !mayBeTap(world) ? [...world.bubbles, world.held.bubble] : [...world.bubbles];
  all.sort((a, b) => b.p.z - a.p.z);
  for (const b of all) drawBubble(canvas, bubblePaint, fx, b, world, box, view);
}
