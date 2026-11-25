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
  /** How much it answers to tilting the phone. */
  tilt: number;
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
    tilt: 1,
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
    tilt: 0,
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
    tilt: 1.1,
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
    tilt: 0.8,
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
    tilt: 0.7,
  },
} satisfies Record<string, Feel>;

export type FeelId = keyof typeof FEELS;

/** How entrants move in a showdown. Not in the tray. */
export const ARENA_FEEL: Feel = {
  name: 'Arena',
  speed: 1,
  restitution: 0.95,
  drag: 0.05,
  minSpeed: 0.2,
  buoyancy: 0,
  wander: 0.15,
  wobble: 1.5,
  tilt: 0,
};
