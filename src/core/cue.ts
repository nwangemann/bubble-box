/** The parts of a cue, from its butt to its tip. */
export const CUE_PARTS = ['butt', 'join', 'shaft', 'ferrule', 'tip'] as const;
export type CuePart = (typeof CUE_PARTS)[number];

/** One part on screen: from `a` to `b`, with its half width at each end, in px. */
export type CueBand = {
  part: CuePart;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  wa: number;
  wb: number;
};

/** `POOL.aim.cue`; lengths and widths in box units at the glass. */
export type CueShape = {
  length: number;
  butt: number;
  tip: number;
  short: number;
  pull: number;
  steady: number;
  share: number;
  join: number;
  ferrule: number;
  end: number;
};

/**
 * A cue on the glass behind the ball in the hand, at `(x, y)` with radius `r` px, pointing at
 * `(tx, ty)` where its aim meets a ball. Its tip waits `short` px off the ball, drawn back by `pull`
 * px as `power` rises to 1. Aimed at the ball itself, as straight at the far wall, it points up
 * the screen: the two blend within `steady` px. `ppu` is px per box unit at the glass.
 */
export function cueBands(
  x: number,
  y: number,
  r: number,
  tx: number,
  ty: number,
  power: number,
  ppu: number,
  shape: CueShape,
): CueBand[] {
  'worklet';
  // From the target back through the ball, leaning down the screen when the two meet.
  let dx = x - tx;
  let dy = y - ty;
  const d = Math.hypot(dx, dy);
  const lean = Math.max(0, 1 - d / shape.steady);
  dy += lean * shape.steady;
  const n = Math.hypot(dx, dy);
  dx /= n;
  dy /= n;
  const gap = r + shape.short + shape.pull * Math.max(0, Math.min(1, power));
  const length = shape.length * ppu;
  // Along the cue from its tip, in px.
  const tipLen = shape.end * ppu;
  const ferrule = shape.ferrule * ppu;
  const join = shape.join * ppu;
  const buttFrom = length * (1 - shape.share);
  const marks = [length, buttFrom, buttFrom - join, tipLen + ferrule, tipLen, 0];
  const at = (s: number) => {
    'worklet';
    return { x: x + dx * (gap + s), y: y + dy * (gap + s) };
  };
  const half = (s: number) => {
    'worklet';
    return ((shape.tip + (shape.butt - shape.tip) * (s / length)) * ppu) / 2;
  };
  const out: CueBand[] = [];
  for (let i = 0; i < CUE_PARTS.length; i++) {
    const s0 = marks[i]!;
    const s1 = marks[i + 1]!;
    if (s1 >= s0) continue;
    const p = at(s0);
    const q = at(s1);
    out.push({
      part: CUE_PARTS[i]!,
      ax: p.x,
      ay: p.y,
      bx: q.x,
      by: q.y,
      wa: half(s0),
      wb: half(s1),
    });
  }
  return out;
}
