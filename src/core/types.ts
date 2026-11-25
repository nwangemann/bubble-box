import type { Pull } from '../config/pulls';
import type { TrailLook } from '../config/trails';

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
  /** Turn rate about the line of sight, clockwise, and how far it has turned. Radians. */
  spin: number;
  turn: number;
  /** Seconds since it began popping; negative while alive. */
  popping: number;
  /** Effect chosen when it began popping. */
  popFx: string;
  /** The larger bubble it is sinking into, and for how long. */
  join: { into: number; seconds: number } | null;
  /** Opacity, 1 unless it is sinking into another. */
  fade: number;
  /** How far its edge bulges towards a bubble it is merging with, in radii. */
  reach: { x: number; y: number };
  /** Seconds before it may merge. */
  shy: number;
};

/**
 * Where a bubble was, which way it was going, and which way its trail lies across its path. `along`
 * is how far it had come, in radii.
 */
export type TrailPoint = { p: Vec3; v: Vec3; side: Vec3; r: number; t: number; along: number };

/** What a bubble has left behind it, oldest first. It outlives its bubble. */
export type Trail = {
  bubble: number;
  look: TrailLook;
  seed: number;
  style: string;
  /** When it began. */
  born: number;
  points: TrailPoint[];
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

/**
 * The air let go by a pop, spreading from where it was. Bubbles from id `firstSpared` on, its own
 * pieces among them, came after it.
 */
export type Puff = { p: Vec3; r: number; age: number; firstSpared: number };

export type Held = {
  /** Touch id. */
  finger: number;
  bubble: Bubble;
  seconds: number;
  target: { x: number; y: number };
  /** Where the touch began. */
  start: { x: number; y: number };
  /** The finger's latest points, oldest first; `t` is in hold seconds. */
  trail: { x: number; y: number; t: number }[];
  /** Every point of the last moments, for swipe speed. */
  recent: { x: number; y: number; t: number }[];
  /** Bubble under the touch when it began, or 0. */
  over: number;
  /** Where on that bubble it landed, from the centre; its edge is at 1. */
  grip: { x: number; y: number };
  /** Whether a quick tap pops that bubble. */
  tapPops: boolean;
  /** Set once the finger has set off quickly enough to be flicking that bubble. */
  flicking: boolean;
};

/** One entrant knocking another out. `p` is where they touched. */
export type Clash = {
  winner: number;
  loser: number;
  p: Vec3;
  /** Where the loser was, how big, and which way it was going. */
  at: Vec3;
  v: Vec3;
  r: number;
  age: number;
};

/**
 * How a free surface rings after a blow, along one axis: the lens-and-cigar mode (2) and the pear
 * mode (3). Amplitudes are shares of the radius.
 */
export type Ringing = { n: Vec3; a2: number; v2: number; a3: number; v3: number };

/** A showdown: entrants meet, one of each pair is knocked out, the last one wins. */
export type Duel = {
  /** Whether a loser is taken in, how many times wider a winner grows, and how far size sways the odds. */
  absorb: boolean;
  grow: number;
  edge: number;
  phase: 'ready' | 'fight' | 'won';
  /** Seconds in this phase, and since the last clash. */
  seconds: number;
  since: number;
  clashes: Clash[];
  /** Who is fighting: cast numbers by bubble id, the first id being 1. */
  entrants: number[];
  /** Every knock-out so far: when, and how many times wider the loser was. */
  log: { winner: number; seconds: number; odds: number }[];
  /** How many have been knocked out, and wins by bubble id. */
  out: number;
  wins: Record<number, number>;
  ringing: Record<number, Ringing>;
  /** Sizes once they have finished growing, by bubble id. */
  sizes: Record<number, number>;
  /** Id of the winner, or 0. */
  champion: number;
  /** Id of the one rooted for, or 0, and whether it rages. The line-up waits while `hold`. */
  favourite: number;
  rage: boolean;
  hold: boolean;
};

export type World = {
  bubbles: Bubble[];
  ripples: Ripple[];
  waves: Wave[];
  bursts: Burst[];
  puffs: Puff[];
  fx: FxPools;
  /** Whether touching bubbles merge; each pair keeps to one entry. */
  merges: boolean[];
  /** How bubbles draw each other; each pair keeps to one entry, and none means no pull. */
  pulls: Pull[];
  /** How tired each pair is of being drawn together, 0 to 1. */
  weary: Record<number, number>;
  /** Trails bubbles may leave; each bubble keeps to one, and none means no trail. */
  trailLooks: TrailLook[];
  trails: Trail[];
  /** A two-finger swipe in progress. Bubbles born or launched during it are spared. */
  sweep: { firstSpared: number; launched: number[] } | null;
  /** One per finger that is growing a bubble. */
  holds: Held[];
  /** What fingers hold is this size throughout, and gains no more power after `charge` seconds. */
  steady: { r: number; charge: number } | null;
  /** Which way gravity points when the phone is at rest, and the pull from tilting away from it. */
  tilt: { rest: Vec3 | null; pull: Vec3 };
  time: number;
  leftover: number;
  nextId: number;
  /** The showdown being fought, if any. */
  duel: Duel | null;
  /** Strongest impact in the latest advance, for haptics. */
  impact: number;
  /** Radius of the largest bubble popped since last asked, for haptics; 0 for none. */
  popped: number;
};
