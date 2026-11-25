/** How the screen side of the box reacts to a hit. Add an entry and it appears in the tray. */
export type Glass = {
  name: string;
  /** Largest bend, in world units (1 = half the screen width). 0 turns the effect off. */
  bend: number;
  /** How far red and blue part. */
  prism: number;
  /** Brightness of light caught on the wave faces. */
  sheen: number;
};

export const GLASS = {
  still: { name: 'Still', bend: 0, prism: 0, sheen: 0 },
  ripple: { name: 'Ripple', bend: 0.07, prism: 0.16, sheen: 0.36 },
} satisfies Record<string, Glass>;

export type GlassId = keyof typeof GLASS;
