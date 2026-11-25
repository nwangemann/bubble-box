import {
  createPicture,
  PaintStyle,
  Skia,
  type SkCanvas,
  type SkPaint,
  type SkPicture,
  type SkRuntimeEffect,
} from '@shopify/react-native-skia';
import { POOL } from '@/config/pool';
import { pockets, type Ball, type Pool, type Trace } from '@/core/pool';
import { scaleAt } from '@/core/projection';
import type { Box, Bubble, Vec3 } from '@/core/types';
import { LIB } from '@/styles/prelude';
import type { View } from './drawScene';
import { roomPicture } from './roomPicture';
import { compilePoolWalls, drawPoolWalls, LIGHTS } from './poolWalls';
import { compileLooks, cutTrail, drawPiece, type Piece } from './trails';

/** A film round a tinted middle. Uniform order matches `drawBall`. */
const BALL = `
uniform float3 color;
uniform float stripe;
uniform float px;
uniform float fade;
uniform float away;
uniform float lit;
uniform float4 far; // haze, dim, dull, rim
uniform float3 air;
${LIB}
half4 main(vec2 p) {
  float d = length(p);
  if (d > 1.0) return half4(0.0);
  vec3 n = vec3(p, sqrt(max(0.0, 1.0 - d * d)));
  float rim = 1.0 - n.z;
  vec3 body = color;
  float band = smoothstep(0.42, 0.36, abs(dot(n, normalize(vec3(0.35, 0.9, -0.2)))));
  body = mix(body, mix(vec3(0.95, 0.96, 1.0), color, band), stripe);
  float light = 0.5 + 0.5 * dot(n, normalize(vec3(-0.45, -0.75, 0.5)));
  vec3 c = body * (0.22 + 0.68 * light * light);
  c += body * 0.35 * pow(rim, 2.0) + film(0.8 + 1.3 * rim + 0.4 * p.y) * 0.16 * pow(rim, 1.5);
  float crisp = 1.0 - far.z * away;
  c *= 1.0 - far.y * away;
  c += body * far.w * (1.0 - away) * pow(rim, 3.0);
  c += vec3(shine(n)) * 0.8 * crisp + body * lit * (0.18 + 0.5 * pow(rim, 2.5));
  c = mix(c, air, far.x * away);
  float a = smoothstep(1.0, 1.0 - 2.0 * px, d) * fade;
  return half4(half3(clamp(c, 0.0, 1.0)) * half(a), half(a));
}
`;

/** A soft streak of a ball's colour, as `trail` in `scene/trails`. */
const WAKE = `
vec3 trail(float v, float k, float born) {
  return tint * (1.0 - 0.35 * v * v);
}`;

function make() {
  const line = Skia.Paint();
  line.setAntiAlias(true);
  const ball = Skia.Paint();
  const contact = Skia.Paint();
  let effect: SkRuntimeEffect | null = null;
  try {
    effect = Skia.RuntimeEffect.Make(BALL);
  } catch (e) {
    console.error('ball failed to compile', e);
  }
  const { look } = POOL.trail;
  const trails = compileLooks({ [look.id]: look }, { [look.id]: WAKE });
  return { line, ball, contact, effect, walls: compilePoolWalls(), trails };
}
export type PoolGpu = ReturnType<typeof make>;
let made: PoolGpu | null = null;
export const getPoolGpu = () => (made ??= make());

/** The room with its pockets, recorded once. */
export function poolRoom(box: Box, view: View): SkPicture {
  const room = roomPicture(box, view, POOL.look);
  const at = (x: number, y: number, z: number) => {
    const s = scaleAt(box, z) * view.ppu;
    return { x: view.cx + x * s, y: view.cy + y * s };
  };
  // Where a ball resting against each wall would drop: `out` from a wall.
  const out = POOL.radius + POOL.mouth;
  const corner = Math.hypot(out, POOL.radius);
  const [r, g, b] = POOL.look.ink;
  return createPicture((canvas) => {
    canvas.drawPicture(room);
    const fill = Skia.Paint();
    fill.setAntiAlias(true);
    fill.setColor(Float32Array.of(0, 0.01, 0.02, POOL.holes.fill));
    const line = Skia.Paint();
    line.setAntiAlias(true);
    line.setStyle(PaintStyle.Stroke);
    line.setStrokeWidth(1.4);
    line.setColor(Float32Array.of(r / 255, g / 255, b / 255, POOL.holes.edge));
    for (const q of pockets(box)) {
      const middle = q.y === 0;
      const inX = -Math.sign(q.x);
      const inY = -Math.sign(q.y);
      for (const normal of middle ? ['x', 'z'] : ['x', 'y', 'z']) {
        const arc = [];
        for (let i = 0; i <= 24; i++) {
          const a = middle ? (i / 24 - 0.5) * Math.PI : ((i / 24) * Math.PI) / 2;
          const c = Math.cos(a) * (middle ? out : corner);
          const s = Math.sin(a) * (middle ? POOL.holes.side : corner);
          const y = q.y + s * (middle ? 1 : inY);
          if (normal === 'x') arc.push(at(q.x, y, q.z - c));
          else if (normal === 'z') arc.push(at(q.x + inX * c, y, q.z));
          else arc.push(at(q.x + inX * c, q.y, q.z - s));
        }
        canvas.drawPath(Skia.Path.Polygon([at(q.x, q.y, q.z), ...arc], true), fill);
        canvas.drawPath(Skia.Path.Polygon(arc, false), line);
      }
    }
  });
}

const AIR = [0.05, 0.14, 0.22];
const FAR = [POOL.far.haze, POOL.far.dim, POOL.far.dull, POOL.rim];

export function drawDisc(
  canvas: SkCanvas,
  paint: SkPaint,
  effect: SkRuntimeEffect,
  which: number,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fade: number,
  away: number,
  lit: number,
) {
  'worklet';
  const r = Math.min(rx, ry);
  if (r < 0.3 || fade <= 0) return;
  const look = POOL.looks[which]!;
  paint.setShader(
    effect.makeShader([...look.color, look.stripe, 1 / (2 * r), fade, away, lit, ...FAR, ...AIR]),
  );
  canvas.save();
  canvas.translate(x, y);
  canvas.scale(rx, ry);
  canvas.drawRect({ x: -1, y: -1, width: 2, height: 2 }, paint);
  canvas.restore();
}

function ink(paint: SkPaint, stroke: boolean, r: number, g: number, b: number, a: number, w = 1) {
  'worklet';
  paint.setStyle(stroke ? 1 : 0);
  paint.setStrokeWidth(w);
  paint.setColor(Float32Array.of(r, g, b, a));
}

/** Draws pieces of trails from `next` as far forward as `z`. Returns the next to draw. */
function drawWakes(
  canvas: SkCanvas,
  gpu: PoolGpu,
  pieces: Piece[],
  next: number,
  z: number,
  time: number,
  box: Box,
  v: View,
) {
  'worklet';
  let i = next;
  for (; i < pieces.length && pieces[i]!.z >= z; i++) {
    const piece = pieces[i]!;
    // One left behind was the cue ball's.
    const tint = LIGHTS[Math.max(0, piece.trail.bubble)]!;
    drawPiece(canvas, gpu.trails, piece, time, box, v, tint);
  }
  return i;
}

export function drawPool(
  canvas: SkCanvas,
  gpu: PoolGpu,
  pool: Pool,
  /** The ball in the hand, and straight ahead from it. */
  held: Bubble | null,
  /** How far it has swelled into the hand, 0 to 1. */
  grown: number,
  trace: Trace | null,
  /** How plainly that shows, 0 to 1. */
  sure: number,
  box: Box,
  v: View,
) {
  'worklet';
  const { effect, line } = gpu;
  if (!effect) return;
  const at = (p: Vec3) => {
    'worklet';
    const s = scaleAt(box, p.z) * v.ppu;
    return { x: v.cx + p.x * s, y: v.cy + p.y * s, s };
  };
  drawPoolWalls(canvas, gpu.contact, gpu.walls, pool.balls, box, v);
  if (trace) {
    const a = at(trace.from);
    const b = at(trace.to);
    ink(line, true, 1, 1, 1, POOL.aim.opacity * sure, 1.3);
    canvas.drawLine(a.x, a.y, b.x, b.y, line);
    canvas.drawCircle(b.x, b.y, trace.r * b.s, line);
  }
  const holes = pockets(box);
  const all: { b: Ball; i: number }[] = [];
  pool.balls.forEach((b, i) => {
    if (b.sunk < POOL.sink) all.push({ b, i });
  });
  all.sort((a, b) => b.b.p.z - a.b.p.z);
  const pieces: Piece[] = [];
  for (const trail of pool.trails) {
    const b = pool.balls[trail.bubble];
    cutTrail(pieces, trail, b && b.sunk < POOL.sink ? b : undefined, pool.time, box);
  }
  pieces.sort((a, b) => b.z - a.z);
  let next = 0;
  for (const { b, i } of all) {
    next = drawWakes(canvas, gpu, pieces, next, b.p.z, pool.time, box, v);
    // A sinking ball eases into its pocket and shrinks away.
    const k = b.sunk < 0 ? 0 : Math.min(1, b.sunk / POOL.sink);
    const q = holes[b.pocket];
    const p =
      k > 0 && q
        ? {
            x: b.p.x + (q.x - b.p.x) * k,
            y: b.p.y + (q.y - b.p.y) * k,
            z: b.p.z + (q.z - b.p.z) * k,
          }
        : b.p;
    const c = at(p);
    const lit = trace && i === trace.hit ? sure : 0;
    const away = p.z / box.depth;
    const r = b.r * c.s * (1 - 0.6 * k * k);
    drawDisc(canvas, gpu.ball, effect, i, c.x, c.y, r, r, 1 - k * k, away, lit);
  }
  drawWakes(canvas, gpu, pieces, next, -Infinity, pool.time, box, v);
  if (trace?.lands) {
    // Where the one it would meet goes.
    const a = at(pool.balls[trace.hit]!.p);
    const b = at(trace.lands);
    const [r, g, bl] = POOL.looks[trace.hit]!.color as [number, number, number];
    ink(line, true, r, g, bl, 0.8 * sure, trace.drops ? 2.4 : 1.2);
    canvas.drawLine(a.x, a.y, b.x, b.y, line);
    canvas.drawCircle(b.x, b.y, POOL.radius * b.s, line);
  }
  if (held) {
    const c = at(held.p);
    const r = held.r * c.s * (1 - (1 - grown) ** 3);
    const rx = r * (1 + held.d.x - held.d.z * 0.3);
    const ry = r * (1 + held.d.y - held.d.z * 0.3);
    drawDisc(canvas, gpu.ball, effect, 0, c.x, c.y, rx, ry, POOL.cue.held, 0, 0.4);
  }
  const down = pool.balls
    .map((b, i) => ({ b, i }))
    .filter(({ b, i }) => i > 0 && b.sunk >= POOL.sink);
  const R = POOL.row;
  down.forEach(({ i }, n) => {
    const x = v.cx + (n - (down.length - 1) / 2) * R.gap;
    drawDisc(canvas, gpu.ball, effect, i, x, R.top, R.radius, R.radius, 0.85, 0, 0);
  });
}
