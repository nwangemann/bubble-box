import { Skia, type SkCanvas, type SkPaint } from '@shopify/react-native-skia';
import { POOL } from '@/config/pool';
import { cueBands } from '@/core/cue';

/** Where light on the balls comes from, on screen, as in `BALL` in `scene/drawPool`. */
const LIGHT = { x: -0.45, y: -0.75 };

/** Paints for the cue: its parts, and the layer that fades it as one. */
export function makeCue() {
  const part = Skia.Paint();
  part.setAntiAlias(true);
  const layer = Skia.Paint();
  return { part, layer };
}
export type CueGpu = ReturnType<typeof makeCue>;

function quad(
  canvas: SkCanvas,
  paint: SkPaint,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  wa: number,
  wb: number,
  nx: number,
  ny: number,
  off: number,
) {
  'worklet';
  // `off` moves it across, as a share of each end's half width.
  const a0 = { x: ax + nx * wa * (off - 1), y: ay + ny * wa * (off - 1) };
  const a1 = { x: ax + nx * wa * (off + 1), y: ay + ny * wa * (off + 1) };
  const b1 = { x: bx + nx * wb * (off + 1), y: by + ny * wb * (off + 1) };
  const b0 = { x: bx + nx * wb * (off - 1), y: by + ny * wb * (off - 1) };
  canvas.drawPath(Skia.Path.Polygon([a0, a1, b1, b0], true), paint);
}

/**
 * The aim as a cue behind the ball in the hand, at `(x, y)` with radius `r` px, pointing at
 * `(tx, ty)`. See `cueBands`.
 */
export function drawCue(
  canvas: SkCanvas,
  gpu: CueGpu,
  x: number,
  y: number,
  r: number,
  tx: number,
  ty: number,
  /** How far the shot has charged, 0 to 1. */
  power: number,
  ppu: number,
  /** How plainly it shows, 0 to 1. */
  sure: number,
) {
  'worklet';
  const shape = POOL.aim.cue;
  const bands = cueBands(x, y, r, tx, ty, power, ppu, shape);
  const first = bands[0];
  const last = bands[bands.length - 1];
  if (!first || !last) return;
  const dx = last.bx - first.ax;
  const dy = last.by - first.ay;
  const d = Math.hypot(dx, dy);
  if (d < 1) return;
  // Across it, turned to face the light.
  let nx = -dy / d;
  let ny = dx / d;
  if (nx * LIGHT.x + ny * LIGHT.y < 0) {
    nx = -nx;
    ny = -ny;
  }
  // Drawn whole, then faded as one so parts do not show through each other.
  gpu.layer.setAlphaf(shape.opacity * sure);
  canvas.saveLayer(gpu.layer);
  const { part } = gpu;
  part.setStyle(0);
  for (const b of bands) {
    const [r, g, bl] = shape.colors[b.part];
    part.setColor(Float32Array.of(r / 255, g / 255, bl / 255, 1));
    quad(canvas, part, b.ax, b.ay, b.bx, b.by, b.wa, b.wb, nx, ny, 0);
  }
  // A domed tip.
  const [tr, tg, tb] = shape.colors.tip;
  part.setColor(Float32Array.of(tr / 255, tg / 255, tb / 255, 1));
  canvas.drawCircle(last.bx, last.by, last.wb, part);
  // A sheen along the lit side, up to the ferrule.
  const { width, offset, opacity } = shape.sheen;
  part.setColor(Float32Array.of(1, 1, 1, opacity));
  for (const b of bands) {
    if (b.part === 'ferrule' || b.part === 'tip') continue;
    const k = width;
    quad(canvas, part, b.ax, b.ay, b.bx, b.by, b.wa * k, b.wb * k, nx, ny, offset / k);
  }
  canvas.restore();
}
