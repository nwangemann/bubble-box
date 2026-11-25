/** The bubble people make themselves. Every slider runs 0 to 1. */
export type Custom = {
  pattern: PatternId;
  /** Places on the colour wheel. */
  colour: number;
  second: number;
  vivid: number;
  size: number;
};

/** In the order `motif` in styles/custom.ts numbers them. */
export const PATTERNS = {
  plain: { name: 'Plain' },
  bands: { name: 'Bands' },
  swirl: { name: 'Swirl' },
  dots: { name: 'Dots' },
  cells: { name: 'Cells' },
  marble: { name: 'Marble' },
  petals: { name: 'Petals' },
} as const;
export type PatternId = keyof typeof PATTERNS;
export const PATTERN_IDS = Object.keys(PATTERNS) as PatternId[];

export const CUSTOM = 'custom';

export const DEFAULT_CUSTOM: Custom = {
  pattern: 'swirl',
  colour: 0.5,
  second: 0.86,
  vivid: 0.6,
  size: 0.5,
};

/** What drawing needs: plain numbers the UI thread can hold. */
export type CustomLook = { uniforms: number[]; tint: number[] };

/** Colour at a place on the wheel, from near white to full. */
export function wheel(hue: number, vivid: number): number[] {
  const saturation = 0.15 + 0.8 * vivid;
  return [5, 3, 1].map((n) => {
    const k = (n + hue * 6) % 6;
    return 1 - saturation * Math.max(0, Math.min(k, 4 - k, 1));
  });
}

/** Uniform order must match styles/custom.ts. */
export function customLook(c: Custom): CustomLook {
  const a = wheel(c.colour, c.vivid);
  const b = wheel(c.second, c.vivid);
  return {
    uniforms: [...a, ...b, PATTERN_IDS.indexOf(c.pattern), c.size],
    tint: a.map((v, i) => (v + b[i]!) / 2),
  };
}

/** Keeps saved values that make sense. */
export function cleanCustom(saved: unknown): Custom {
  const out = { ...DEFAULT_CUSTOM };
  if (typeof saved !== 'object' || saved === null) return out;
  const from = saved as Record<string, unknown>;
  for (const key of ['colour', 'second', 'vivid', 'size'] as const) {
    const value = from[key];
    if (typeof value === 'number' && value >= 0 && value <= 1) out[key] = value;
  }
  const pattern = PATTERN_IDS.find((id) => id === from.pattern);
  if (pattern) out.pattern = pattern;
  return out;
}
