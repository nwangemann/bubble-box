export type Vec3 = { x: number; y: number; z: number };

/** The room. The screen is z = 0; x and y are centred on it, y down. */
export type Box = { hw: number; hh: number; depth: number; focal: number };

export type Bubble = {
  id: number;
  style: string;
  seed: number;
  r: number;
  p: Vec3;
  v: Vec3;
  /** Squash per axis (0 = round) and its rate. */
  d: Vec3;
  dv: Vec3;
  /** Seconds since it began popping; negative while alive. */
  popping: number;
  /** Effect chosen when it began popping. */
  popFx: string;
};

export type Axis = 'x' | 'y' | 'z';
export type Ripple = { p: Vec3; axis: Axis; age: number; strength: number; variant: number };

/** A hit on the glass, in screen-plane coordinates. */
export type Wave = { x: number; y: number; age: number; strength: number; variant: number };

/** Light thrown off where bubbles meet or pop. Drawn by `src/fx`. */
export type Burst = {
  fx: string;
  p: Vec3;
  v: Vec3;
  /** Contact normal, from bubble a to bubble b. */
  n: Vec3;
  /** Sideways rub, -1 to 1 as seen by the viewer. */
  spin: number;
  size: number;
  strength: number;
  seed: number;
  age: number;
  styleA: string;
  styleB: string;
  /** Ids of the pair, or 0 for a pop. */
  pair: number;
};

/** Effects to choose from; more than one means Random, none means no effect. */
export type FxPools = {
  meet: string[];
  pop: string[];
  lives: Record<string, number>;
  pieces: Record<string, number>;
};

export type Held = {
  bubble: Bubble;
  seconds: number;
  target: { x: number; y: number };
  /** Where the touch began. */
  start: { x: number; y: number };
  /** Bubble under the touch when it began, or 0. */
  over: number;
};

export type World = {
  bubbles: Bubble[];
  ripples: Ripple[];
  waves: Wave[];
  bursts: Burst[];
  fx: FxPools;
  /** A two-finger swipe in progress. Bubbles born during it are spared. */
  sweep: { firstSpared: number; travelled: number } | null;
  lastLaunch: { id: number; time: number; heldFor: number };
  held: Held | null;
  time: number;
  leftover: number;
  nextId: number;
  /** Strongest impact in the latest advance, for haptics. */
  impact: number;
};
