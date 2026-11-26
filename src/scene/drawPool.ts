import {
  createPicture,
  PaintStyle,
  Skia,
  type SkCanvas,
  type SkPaint,
  type SkPicture,
  type SkRuntimeEffect,
} from '@shopify/react-native-skia';
import { POOL, type Table } from '@/config/pool';
import {
  crownAt,
  filled,
  placeAt,
  smooth,
  turnMark,
  type PoolRowLayout,
  type RowTurn,
} from '@/core/poolRow';
import { pockets, snugs, type Ball, type Pool, type Trace } from '@/core/pool';
import { EIGHT } from '@/core/poolGame';
import { scaleAt } from '@/core/projection';
import type { Box, Bubble, Vec3 } from '@/core/types';
import { LIB } from '@/styles/prelude';
import type { View } from './drawScene';
import { roomPicture } from './roomPicture';
import { compilePots, drawMotes, drawPots } from './poolPots';
import { compilePoolWalls, drawPoolWalls, LIGHTS } from './poolWalls';
import { compileLooks, cutTrail, drawPiece, type Piece } from './trails';

/** A film round a tinted middle. Uniform order matches `drawBall`. */
const BALL = `
uniform float3 color;
uniform float2 kind; // stripe, eight
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
  body = mix(body, mix(vec3(0.95, 0.96, 1.0), color, band), kind.x);
  // The 8: its figure on a pale spot, always facing.
  float soft = max(0.03, 2.0 * px);
  float spot8 = smoothstep(0.54 + soft, 0.54 - soft, d) * kind.y;
  float loop = min(abs(length(p - vec2(0.0, -0.15)) - 0.14), abs(length(p - vec2(0.0, 0.17)) - 0.17));
  float figure = smoothstep(0.055 + soft, 0.055 - soft, loop);
  body = mix(body, mix(vec3(0.95, 0.96, 1.0), color, figure), spot8);
  float light = 0.5 + 0.5 * dot(n, normalize(vec3(-0.45, -0.75, 0.5)));
  vec3 c = body * (0.22 + 0.68 * light * light);
  c += body * 0.35 * pow(rim, 2.0) + film(0.8 + 1.3 * rim + 0.4 * p.y) * 0.16 * pow(rim, 1.5);
  float crisp = 1.0 - far.z * away;
  c *= 1.0 - far.y * away;
  c += body * far.w * (1.0 - away) * pow(rim, 3.0);
  c += vec3(shine(n)) * 0.8 * crisp + body * lit * (0.18 + 0.5 * pow(rim, 2.5));
  // Black would be lost against the room.
  c += vec3(0.55, 0.65, 0.75) * pow(rim, 1.5) * 0.9 * kind.y;
  // Its spot stays bright in the haze.
  c = mix(c, air, far.x * away * (1.0 - 0.6 * spot8));
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
  return { line, ball, contact, effect, walls: compilePoolWalls(), pots: compilePots(), trails };
}
export type PoolGpu = ReturnType<typeof make>;
let made: PoolGpu | null = null;
export const getPoolGpu = () => (made ??= make());

/** The room with its pockets, recorded once for each table. */
export function poolRoom(box: Box, view: View, table: Table): SkPicture {
  const room = roomPicture(box, view, table.room);
  const at = (x: number, y: number, z: number) => {
    const s = scaleAt(box, z) * view.ppu;
    return { x: view.cx + x * s, y: view.cy + y * s };
  };
  // Where a ball resting against each wall would drop: `out` from a wall.
  const out = POOL.radius + POOL.mouth;
  const corner = Math.hypot(out, POOL.radius);
  const [r, g, b] = table.mark;
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

/** A ball's colour as a line: the 8's is pale, as black would not show. */
const MARKS = POOL.looks.map(({ color, kind }) => (kind === 'eight' ? [0.8, 0.85, 0.9] : color));
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
  /** What it hazes into with `away`. */
  air: readonly number[],
) {
  'worklet';
  const r = Math.min(rx, ry);
  if (r < 0.3 || fade <= 0) return;
  const look = POOL.looks[which]!;
  paint.setShader(
    effect.makeShader([
      ...look.color,
      look.kind === 'stripe' ? 1 : 0,
      look.kind === 'eight' ? 1 : 0,
      1 / (2 * r),
      fade,
      away,
      lit,
      ...FAR,
      ...air,
    ]),
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

/** Every ball to pot, in its place: potted ones whole, the rest as rings. Then whose turn it is. */
function drawRow(
  canvas: SkCanvas,
  gpu: PoolGpu,
  effect: SkRuntimeEffect,
  pool: Pool,
  row: PoolRowLayout,
  turn: RowTurn,
  v: View,
  /** The table's own lines, for whose turn, as 0 to 1. */
  pen: readonly number[],
  air: readonly number[],
) {
  'worklet';
  const { top, ghost, ring, win } = POOL.row;
  const r = row.radius;
  for (const { kind, places } of row.groups)
    for (const { ball, x } of places) {
      const b = pool.balls[ball];
      // One set back empties its place as it eases in on the table; one that only faded, for the
      // next game, never filled it.
      const k = !b
        ? 0
        : b.back >= 0
          ? b.emptying
            ? 1 - smooth(b.back / POOL.spot.ease)
            : 0
          : b.sunk >= 0 && b.pocket < 0
            ? 0
            : filled(b.sunk, pool.calm);
      const size = r * (0.8 + 0.2 * k);
      const at = placeAt(row, kind, x, turn.swap);
      const px = v.cx + at.x;
      const py = top + at.y;
      if (turn.won > 0 && (kind === 'eight' || kind === turn.crown)) {
        // The winner's: lit from the 8 outwards.
        const lit = crownAt(turn.won, Math.abs(at.x) / row.end);
        const [cr, cg, cb] = pen;
        ink(gpu.line, true, cr!, cg!, cb!, win.opacity * lit, win.width);
        canvas.drawCircle(px, py, r + win.out * lit, gpu.line);
      }
      drawDisc(
        canvas,
        gpu.ball,
        effect,
        ball,
        px,
        py,
        size,
        size,
        ghost + (1 - ghost) * k,
        0,
        0,
        air,
      );
      if (k >= 1) continue;
      const t = MARKS[ball]!;
      ink(gpu.line, true, t[0]!, t[1]!, t[2]!, ring * (1 - k), 1.2);
      canvas.drawCircle(px, py, r - 0.6, gpu.line);
    }
  const { below, width, opacity, second, short } = POOL.row.turn;
  const mark = turnMark(row, turn.side);
  const [cr, cg, cb] = pen;
  const y = top + below;
  // Round ends, then back to butt for the rest.
  gpu.line.setStrokeCap(1);
  // The winner's line brightens.
  const bright = opacity + (win.line - opacity) * smooth(turn.won);
  ink(gpu.line, true, cr!, cg!, cb!, bright, width);
  canvas.drawLine(v.cx + mark.x - mark.half, y, v.cx + mark.x + mark.half, y, gpu.line);
  if (turn.second > 0) {
    // A second shot to come, after the opponent's foul.
    const half = mark.half * short;
    ink(gpu.line, true, cr!, cg!, cb!, opacity * turn.second, width);
    const y2 = y + second;
    canvas.drawLine(v.cx + mark.x - half, y2, v.cx + mark.x + half, y2, gpu.line);
  }
  gpu.line.setStrokeCap(0);
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
  /** The pocket that line calls for the 8, or -1. */
  called: number,
  row: PoolRowLayout,
  turn: RowTurn,
  box: Box,
  v: View,
  table: Table,
) {
  'worklet';
  const { effect, line } = gpu;
  const { air } = table;
  if (!effect) return;
  const at = (p: Vec3) => {
    'worklet';
    const s = scaleAt(box, p.z) * v.ppu;
    return { x: v.cx + p.x * s, y: v.cy + p.y * s, s };
  };
  drawPots(canvas, gpu.pots, pool, box, v);
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
    // One set back on its spot swells in.
    const e = b.back >= 0 ? smooth(b.back / POOL.spot.ease) : 1;
    const r = b.r * c.s * (1 - 0.6 * k * k) * (0.6 + 0.4 * e);
    drawDisc(canvas, gpu.ball, effect, i, c.x, c.y, r, r, (1 - k * k) * e, away, lit, air);
  }
  drawWakes(canvas, gpu, pieces, next, -Infinity, pool.time, box, v);
  if (trace?.lands) {
    // Where the one it would meet goes.
    const a = at(pool.balls[trace.hit]!.p);
    const b = at(trace.lands);
    const [r, g, bl] = MARKS[trace.hit] as [number, number, number];
    ink(line, true, r, g, bl, 0.8 * sure, trace.drops ? 2.4 : 1.2);
    canvas.drawLine(a.x, a.y, b.x, b.y, line);
    canvas.drawCircle(b.x, b.y, POOL.radius * b.s, line);
  }
  const hole = snugs(box)[called];
  if (hole) {
    // The pocket called for the 8: a ring round where it would sit.
    const { size, opacity, width } = POOL.aim.call;
    const c = at(hole);
    const [r, g, bl] = MARKS[EIGHT] as [number, number, number];
    ink(line, true, r, g, bl, opacity * sure, width);
    canvas.drawCircle(c.x, c.y, POOL.radius * size * c.s, line);
  }
  if (held) {
    const c = at(held.p);
    const r = held.r * c.s * (1 - (1 - grown) ** 3);
    const rx = r * (1 + held.d.x - held.d.z * 0.3);
    const ry = r * (1 + held.d.y - held.d.z * 0.3);
    drawDisc(canvas, gpu.ball, effect, 0, c.x, c.y, rx, ry, POOL.cue.held, 0, 0.4, air);
  }
  drawRow(
    canvas,
    gpu,
    effect,
    pool,
    row,
    turn,
    v,
    table.mark.map((c) => c / 255),
    air,
  );
  drawMotes(canvas, gpu.pots, pool, row, turn, box, v);
}
