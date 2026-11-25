/** Physics presets. Add an entry and it appears in the tray. */
export type Feel = {
  name: string;
  /** Multiplies launch speed. */
  speed: number;
  /** Share of speed kept on a bounce. */
  restitution: number;
  /** Share of speed lost per second, roughly. */
  drag: number;
  /** Bubbles never drift slower than this. */
  minSpeed: number;
  /** Upward acceleration; negative sinks. */
  buoyancy: number;
  /** Strength of slow air currents. */
  wander: number;
  wobble: number;
};

export const FEELS = {
  drift: {
    name: 'Drift',
    speed: 1,
    restitution: 0.88,
    drag: 0.1,
    minSpeed: 0.3,
    buoyancy: 0,
    wander: 0.12,
    wobble: 1,
  },
  weightless: {
    name: 'Weightless',
    speed: 0.9,
    restitution: 1,
    drag: 0,
    minSpeed: 0.2,
    buoyancy: 0,
    wander: 0,
    wobble: 0.8,
  },
  lively: {
    name: 'Lively',
    speed: 1.7,
    restitution: 0.97,
    drag: 0.03,
    minSpeed: 0.8,
    buoyancy: 0,
    wander: 0.1,
    wobble: 1.4,
  },
  syrup: {
    name: 'Syrup',
    speed: 1.15,
    restitution: 0.6,
    drag: 0.45,
    minSpeed: 0.14,
    buoyancy: 0.02,
    wander: 0.08,
    wobble: 1.7,
  },
  ascend: {
    name: 'Ascend',
    speed: 1,
    restitution: 0.7,
    drag: 0.25,
    minSpeed: 0.2,
    buoyancy: 0.45,
    wander: 0.25,
    wobble: 1,
  },
} satisfies Record<string, Feel>;

export type FeelId = keyof typeof FEELS;
