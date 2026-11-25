import {
  Skia,
  type SkCanvas,
  type SkPaint,
  type SkRuntimeEffect,
  type SkShader,
} from '@shopify/react-native-skia';
import { AIR } from '@/config/arena';
import { TUNING } from '@/config/tuning';
import { awayAt, scaleAt } from '@/core/projection';
import type { Box, Bubble, Clash, World } from '@/core/types';
import type { Theme } from '@/showdown/types';
import type { View } from './drawScene';
import { PARTNERS } from './liquid';
import { fighterLook, type FighterLook } from './showdownPictures';

export type ShowdownLook = {
  cast: FighterLook[];
  accent: number[];
  mote: { color: number[]; size: number; rise: number };
  /** Colours the films mirror: high sky, low sky, floor. */
  room: number[];
  fill: SkPaint;
  film: SkPaint;
  layer: SkPaint;
};

const GOLDEN = 0.61803;
/** Size of a figure against its bubble, and how far down it hangs. */
const FIGURE = { size: 0.5, drop: 0.16 };
const NO_PARTNER = [0, 0, 0, 0];
const NO_DYE = [0, 0, 0];

/** Plain data and painted images for the frame loop. Made once per showdown. */
export function showdownLook(theme: Theme): ShowdownLook {
  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  const rgb = (c: string) => [...Skia.Color(c)].slice(0, 3);
  return {
    cast: theme.cast.map((f) => fighterLook(f, rgb(theme.backdrop[0]))),
    accent: [...Skia.Color(theme.accent)],
    mote: { ...theme.motes, color: [...Skia.Color(theme.motes.color)] },
    room: [...rgb(theme.backdrop[1]), ...rgb(theme.backdrop[0]), ...rgb(theme.backdrop[1])],
    fill,
    film: Skia.Paint(),
    layer: Skia.Paint(),
  };
}

/** What a film needs to see the scene behind it. */
export type Backdrop = { shader: SkShader; scale: number };

function tint(paint: SkPaint, c: number[], alpha: number) {
  'worklet';
  paint.setColor(Float32Array.of(c[0]!, c[1]!, c[2]!, alpha));
}

/** Which of the cast a bubble is, even once it is gone. */
export function castOf(w: World, id: number) {
  'worklet';
  return w.duel?.entrants[id - 1] ?? 0;
}

function smooth(t: number) {
  'worklet';
  const k = Math.max(0, Math.min(1, t));
  return k * k * (3 - 2 * k);
}

/** Swells gently into being during the line-up. */
function enterOf(w: World, b: Bubble) {
  'worklet';
  if (w.duel?.phase !== 'ready') return 1;
  return smooth((w.duel.seconds - b.id * 0.06) / 0.9);
}

export function drawFigure(
  canvas: SkCanvas,
  layer: SkPaint,
  f: FighterLook,
  x: number,
  y: number,
  r: number,
  lean: number,
  alpha: number,
  away: number,
) {
  'worklet';
  if (!f.figure || alpha <= 0.01 || r <= 0.5) return;
  canvas.save();
  canvas.translate(x, y + r * FIGURE.drop);
  canvas.rotate(lean, 0, 0);
  canvas.scale(r * FIGURE.size, r * FIGURE.size);
  // The distant painting comes up beneath before the near one goes, so it never turns see-through.
  const near = f.distant ? 1 - smooth(away * 1.25 - 0.25) : 1;
  if (f.distant && away > 0) {
    layer.setAlphaf(alpha * Math.min(1, away * 4));
    canvas.drawImageRect(f.distant, f.distantSrc, f.dest, layer);
  }
  if (near > 0.01) {
    layer.setAlphaf(alpha * near);
    canvas.drawImageRect(f.figure, f.src, f.dest, layer);
  }
  canvas.restore();
}

export type Surface = {
  time: number;
  seed: number;
  motif: number;
  tear: number;
  modes: number[];
  axis: number[];
  hole: number[];
  /** How far into the arena its centre is, unclamped, and its radius on that scale. */
  away: number[];
  /** Offsets and radii of what it is taking in, in its own radii, and their colours. */
  partners: number[][];
  dyes: number[][];
};

/** One film, or several joined into one. */
export function drawLiquid(
  canvas: SkCanvas,
  paint: SkPaint,
  effect: SkRuntimeEffect,
  back: Backdrop,
  f: FighterLook,
  room: number[],
  x: number,
  y: number,
  rx: number,
  ry: number,
  o: Surface,
) {
  'worklet';
  const r = (rx + ry) / 2;
  const uniforms = [
    o.time,
    o.seed,
    1 / Math.max(1, r * 2),
    o.motif,
    o.tear,
    TUNING.showdown.neck,
    x * back.scale,
    y * back.scale,
    r * back.scale,
    ...o.modes,
    ...o.axis,
    ...o.hole,
    ...o.away,
    AIR.haze,
    AIR.dim,
    AIR.film,
  ];
  let reach =
    1.02 +
    AIR.film * Math.max(0, Math.min(1, o.away[0]!)) +
    Math.abs(o.modes[0]!) +
    Math.abs(o.modes[1]!);
  for (let i = 0; i < PARTNERS; i++) {
    const p = o.partners[i] ?? NO_PARTNER;
    uniforms.push(...p);
    if (p[3]! > 0) reach = Math.max(reach, Math.hypot(p[0]!, p[1]!) + p[3]! + 0.1 + AIR.film);
  }
  for (let i = 0; i < PARTNERS; i++) uniforms.push(...(o.dyes[i] ?? NO_DYE));
  uniforms.push(...f.lit, ...f.shade, ...room);
  paint.setShader(effect.makeShaderWithChildren(uniforms, [back.shader]));
  canvas.save();
  canvas.translate(x, y);
  canvas.scale(rx, ry);
  canvas.drawRect({ x: -reach, y: -reach, width: reach * 2, height: reach * 2 }, paint);
  canvas.restore();
}

/** Everything sinking into a bubble, however indirectly. */
function drawnInto(w: World, root: Bubble) {
  'worklet';
  const found: Bubble[] = [];
  const ids = [root.id];
  // Those joining later sit deeper in the chain; a few passes reach them all.
  for (let pass = 0; pass < 4; pass++)
    for (const b of w.bubbles) {
      if (!b.join || found.includes(b) || !ids.includes(b.join.into)) continue;
      found.push(b);
      ids.push(b.id);
    }
  return found.sort((a, b) => b.r - a.r);
}

function drawBubble(
  canvas: SkCanvas,
  look: ShowdownLook,
  effect: SkRuntimeEffect | null,
  back: Backdrop | null,
  b: Bubble,
  w: World,
  box: Box,
  v: View,
  calm: boolean,
) {
  'worklet';
  const duel = w.duel!;
  const f = look.cast[castOf(w, b.id)];
  const enter = enterOf(w, b);
  if (!f || enter <= 0.01) return;
  const s = scaleAt(box, b.p.z) * v.ppu;
  const r = b.r * s * enter;
  const x = v.cx + b.p.x * s;
  const y = v.cy + b.p.y * s;
  const rx = r * (1 + b.d.x - b.d.z * 0.3);
  const ry = r * (1 + b.d.y - b.d.z * 0.3);
  const gone = b.popping < 0 ? 0 : Math.min(1, b.popping / 0.22);
  const lost = duel.clashes.find((c) => c.loser === b.id);
  const partners: number[][] = [];
  const dyes: number[][] = [];
  const sway = calm ? 0 : Math.sin(w.time * 1.1 + b.seed * 20) * 3;
  const lean = Math.max(-12, Math.min(12, b.v.x * 8)) + sway;
  const inside = drawnInto(w, b);
  for (const o of inside) {
    const os = scaleAt(box, o.p.z) * v.ppu;
    const ox = v.cx + o.p.x * os;
    const oy = v.cy + o.p.y * os;
    const g = look.cast[castOf(w, o.id)]!;
    // The figure dissolves as its bubble drains.
    drawFigure(
      canvas,
      look.layer,
      g,
      ox,
      oy,
      o.r * os,
      lean,
      smooth(o.fade * 1.4 - 0.4),
      awayAt(box, o.p.z, AIR.from),
    );
    if (partners.length >= PARTNERS) continue;
    partners.push([
      (ox - x) / r,
      (oy - y) / r,
      ((b.p.z - o.p.z) * s) / r,
      Math.max(0.0011, (o.r * os) / r),
    ]);
    dyes.push(g.lit);
  }
  drawFigure(canvas, look.layer, f, x, y, r, lean, 1 - gone * 1.6, awayAt(box, b.p.z, AIR.from));
  if (!effect || !back) return;
  const ring = duel.ringing[b.id];
  let hole = [0, 0, 1];
  if (lost) {
    const hx = lost.p.x - lost.at.x;
    const hy = lost.p.y - lost.at.y;
    const hz = lost.at.z - lost.p.z;
    const l = Math.max(1e-6, Math.hypot(hx, hy, hz));
    hole = [hx / l, hy / l, hz / l];
  }
  drawLiquid(canvas, look.film, effect, back, f, look.room, x, y, rx, ry, {
    time: w.time,
    seed: b.seed,
    motif: castOf(w, b.id),
    tear: gone,
    modes: ring ? [ring.a2, ring.a3] : [0, 0],
    axis: ring ? [ring.n.x, ring.n.y, -ring.n.z] : [1, 0, 0],
    hole,
    away: [(b.p.z / box.depth - AIR.from) / (1 - AIR.from), b.r / box.depth / (1 - AIR.from)],
    partners,
    dyes,
  });
}

function drawShadow(canvas: SkCanvas, look: ShowdownLook, b: Bubble, box: Box, v: View) {
  'worklet';
  if (b.popping >= 0) return;
  const s = scaleAt(box, b.p.z) * v.ppu;
  const near = 1 - Math.min(1, (box.hh - b.p.y) / (box.hh * 2));
  const rx = b.r * s * (1.35 - near * 0.4);
  const x = v.cx + b.p.x * s;
  const y = v.cy + box.hh * s;
  // Soft edged, with the light a bubble focuses in its middle.
  for (let i = 3; i > 0; i--) {
    look.fill.setColor(Float32Array.of(0, 0, 0, (0.03 + 0.09 * near) * b.fade));
    const k = rx * (0.5 + i * 0.2);
    canvas.drawOval({ x: x - k, y: y - k * 0.2, width: k * 2, height: k * 0.4 }, look.fill);
  }
  const c = look.cast[Number(b.style)]!.lit;
  tint(look.fill, c, (0.05 + 0.12 * near) * b.fade);
  canvas.drawOval(
    { x: x - rx * 0.4, y: y - rx * 0.08, width: rx * 0.8, height: rx * 0.16 },
    look.fill,
  );
}

/** Fine mist where a film gave way: thrown out, slowed by the air, then sinking. */
function drawSpray(canvas: SkCanvas, look: ShowdownLook, c: Clash, w: World, box: Box, v: View) {
  'worklet';
  const S = TUNING.showdown;
  const life = c.age / S.clash;
  const s = scaleAt(box, c.at.z) * v.ppu;
  const merged = w.duel!.absorb;
  const clear = 1 - AIR.haze * awayAt(box, c.at.z, AIR.from);
  const loser = look.cast[castOf(w, c.loser)]!.lit;
  const nx = c.at.x - c.p.x;
  const ny = c.at.y - c.p.y;
  const l = Math.max(1e-6, Math.hypot(nx, ny));
  const slow = 1 - Math.exp(-5 * c.age);
  for (let i = 0; i < S.spray; i++) {
    const a = i * GOLDEN * 6.2832;
    const far = 0.15 + ((i * 0.379) % 1) * 0.5;
    let x = c.at.x + Math.cos(a) * c.r;
    let y = c.at.y + Math.sin(a) * c.r;
    if (merged) {
      // Off the rim of the opening neck, across the line of contact.
      const side = i % 2 ? 1 : -1;
      x = c.p.x + ((-ny / l) * side + Math.cos(a) * 0.25) * (0.06 + far * 0.1);
      y = c.p.y + ((nx / l) * side + Math.sin(a) * 0.25) * (0.06 + far * 0.1);
      x += (-ny / l) * side * far * slow * 0.45;
      y += (nx / l) * side * far * slow * 0.45;
    } else {
      x += Math.cos(a) * far * slow * 0.5 + c.v.x * 0.1 * slow;
      y += Math.sin(a) * far * slow * 0.5 + c.v.y * 0.1 * slow;
    }
    y += c.age * c.age * 0.14;
    const size = (0.0035 + ((i * 0.713) % 1) ** 2 * 0.011) * s;
    const alpha = (1 - life) * (merged ? 0.45 : 0.6) * clear;
    tint(look.fill, loser, alpha * 0.7);
    canvas.drawCircle(v.cx + x * s, v.cy + y * s, size, look.fill);
    look.fill.setColor(Float32Array.of(1, 1, 1, alpha));
    canvas.drawCircle(v.cx + x * s - size * 0.3, v.cy + y * s - size * 0.3, size * 0.4, look.fill);
  }
}

/** The room falls away behind the winner and light gathers round it. */
function drawGlory(canvas: SkCanvas, look: ShowdownLook, b: Bubble, w: World, box: Box, v: View) {
  'worklet';
  const t = w.duel!.seconds - TUNING.showdown.bask;
  if (t <= 0) return;
  const k = smooth(t / 1.6);
  look.fill.setColor(Float32Array.of(0.02, 0.015, 0.05, 0.5 * k));
  canvas.drawRect({ x: 0, y: 0, width: v.cx * 2, height: v.cy * 2 }, look.fill);
  const s = scaleAt(box, b.p.z) * v.ppu;
  const x = v.cx + b.p.x * s;
  const y = v.cy + b.p.y * s;
  const r = b.r * s;
  for (let i = 14; i > 0; i--) {
    tint(look.fill, look.accent, 0.028 * k);
    canvas.drawCircle(x, y, r * (0.95 + i * 0.07), look.fill);
  }
  // Motes of light in slow orbits.
  for (let i = 0; i < 36; i++) {
    const a = i * GOLDEN * 6.2832 + w.time * (0.08 + ((i * 0.37) % 1) * 0.1);
    const far = r * (1.2 + ((i * 0.713) % 1) * 0.75);
    const glint = 0.35 + 0.65 * Math.max(0, Math.sin(w.time * 1.3 + i * 2.1));
    tint(look.fill, look.accent, 0.7 * k * glint);
    canvas.drawCircle(
      x + Math.cos(a) * far,
      y + Math.sin(a) * far * 0.92,
      r * (0.006 + ((i * 0.29) % 1) * 0.01),
      look.fill,
    );
  }
}

export function drawShowdown(
  canvas: SkCanvas,
  look: ShowdownLook,
  effect: SkRuntimeEffect | null,
  back: Backdrop | null,
  w: World,
  box: Box,
  v: View,
  calm: boolean,
) {
  'worklet';
  const duel = w.duel;
  if (!duel) return;
  const { color, size, rise } = look.mote;
  const tall = box.hh * 2;
  for (let i = 0; i < TUNING.showdown.motes; i++) {
    const drift = calm ? 0 : w.time * rise * (0.5 + ((i * 0.31) % 1));
    const up = (((((i * GOLDEN) % 1) * tall + drift) % tall) + tall) % tall;
    const x = ((i * 0.754) % 1) * 2 - 1 + (calm ? 0 : Math.sin(w.time * 0.5 + i) * 0.08);
    tint(look.fill, color, 0.15 + 0.25 * (0.5 + 0.5 * Math.sin(w.time * 1.5 + i * 2)));
    canvas.drawCircle(
      v.cx + x * v.ppu,
      v.cy + (box.hh - up) * v.ppu,
      size * v.ppu * (0.4 + ((i * 0.47) % 1) * 0.6),
      look.fill,
    );
  }
  const all = [...w.bubbles];
  all.sort((a, b) => b.p.z - a.p.z);
  for (const b of all) drawShadow(canvas, look, b, box, v);
  const best = duel.phase === 'won' ? w.bubbles.find((b) => b.id === duel.champion) : undefined;
  if (best) drawGlory(canvas, look, best, w, box, v);
  // A bubble being taken in is part of the surface that takes it.
  for (const b of all) if (!b.join) drawBubble(canvas, look, effect, back, b, w, box, v, calm);
  for (const c of duel.clashes) drawSpray(canvas, look, c, w, box, v);
}
