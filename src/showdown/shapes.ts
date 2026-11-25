/** One drawn mark. Colours are hex, with alpha if wanted. `d` is an SVG path. */
export type Shape = {
  d: string;
  fill?: string;
  /** The fill runs to this at the bottom of the shape. */
  to?: string;
  line?: string;
  w?: number;
  /** Mirrored left to right. */
  flip?: boolean;
  blur?: number;
};

export const INK = '#1c1330';

/** A filled shape with a cartoon outline. */
export const shape = (d: string, color: string, w = 0.045): Shape => ({
  d,
  fill: color,
  line: INK,
  w,
});
export const fill = (d: string, color: string): Shape => ({ d, fill: color });
export const line = (d: string, color: string = INK, w = 0.05): Shape => ({ d, line: color, w });
export const glow = (d: string, color: string, blur = 0.08): Shape => ({ d, fill: color, blur });
/** Shapes, then the same mirrored. */
export const both = (...s: Shape[]): Shape[] => [...s, ...s.map((o) => ({ ...o, flip: !o.flip }))];

export const n = (v: number) => String(Math.round(v * 1000) / 1000);
export const oval = (x: number, y: number, rx: number, ry = rx) =>
  `M${n(x - rx)} ${n(y)}A${n(rx)} ${n(ry)} 0 1 1 ${n(x + rx)} ${n(y)}A${n(rx)} ${n(ry)} 0 1 1 ${n(x - rx)} ${n(y)}Z`;
export const rect = (x: number, y: number, w: number, h: number) =>
  `M${n(x)} ${n(y)}H${n(x + w)}V${n(y + h)}H${n(x)}Z`;
export const poly = (...xy: number[]) => {
  let d = '';
  for (let i = 0; i < xy.length; i += 2) d += `${i ? 'L' : 'M'}${n(xy[i]!)} ${n(xy[i + 1]!)}`;
  return d + 'Z';
};
export const star = (x: number, y: number, r: number, points = 5, inner = 0.42, turn = 0) => {
  const xy: number[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = ((i / points) * 180 - 90 + turn) * (Math.PI / 180);
    const k = i % 2 ? r * inner : r;
    xy.push(x + Math.cos(a) * k, y + Math.sin(a) * k);
  }
  return poly(...xy);
};
/** Repeatable scatter, so scenery is the same every time. */
export const scatter = <T>(count: number, make: (a: number, b: number, c: number) => T): T[] =>
  Array.from({ length: count }, (_, i) =>
    make((i * 0.61803 + 0.13) % 1, (i * 0.75488 + 0.37) % 1, (i * 0.56984 + 0.71) % 1),
  );
