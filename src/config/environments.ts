export type WallId = 'frost' | 'water' | 'silk' | 'stone' | 'felt';
type Rgb = [number, number, number];

/** How a box looks by day: the same room in other light. */
type Palette = {
  /** Centre and edge of the backdrop gradient. */
  backdrop: [string, string];
  /** Line, wall and ripple colour as 0-255 rgb. */
  ink: Rgb;
};

/** The box. Add an entry and it appears in the tray. */
export type BoxLook = Palette & {
  name: string;
  day: Palette;
  edgeOpacity: number;
  /** Cells per wall; 0 for none. */
  grid: number;
  gridOpacity: number;
  faceOpacity: number;
  rippleOpacity: number;
  /** Multiplies the feel's restitution. */
  bounce: number;
  /** Wall material, drawn by `scene/walls`. */
  wall?: WallId;
  /** How strongly walls catch light from glowing bubbles. */
  lit: number;
};

/** A box in its light, with the wall sliders applied. */
export type Environment = BoxLook & { wallOpacity: number; softness: number };

/** What `roomPicture` needs of a box. */
export type RoomLook = Pick<
  Environment,
  | 'backdrop'
  | 'ink'
  | 'edgeOpacity'
  | 'grid'
  | 'gridOpacity'
  | 'faceOpacity'
  | 'wall'
  | 'wallOpacity'
  | 'softness'
>;

/** Wall sliders, 0 to 1. */
export type Walls = { opacity: number; softness: number };

export const ENVIRONMENTS = {
  invisible: {
    name: 'Invisible',
    backdrop: ['#141a38', '#05070f'],
    ink: [190, 205, 255],
    day: { backdrop: ['#a9c4dd', '#6485ad'], ink: [245, 250, 255] },
    edgeOpacity: 0,
    grid: 0,
    gridOpacity: 0,
    faceOpacity: 0,
    rippleOpacity: 0.3,
    bounce: 1,
    lit: 0,
  },
  whisper: {
    name: 'Whisper',
    backdrop: ['#1b2036', '#080a14'],
    ink: [200, 215, 255],
    day: { backdrop: ['#b7bfd6', '#767f9e'], ink: [250, 250, 255] },
    edgeOpacity: 0.16,
    grid: 0,
    gridOpacity: 0,
    faceOpacity: 0.015,
    rippleOpacity: 0.4,
    bounce: 1,
    lit: 0.8,
  },
  lattice: {
    name: 'Lattice',
    backdrop: ['#0d2430', '#03090e'],
    ink: [130, 235, 225],
    day: { backdrop: ['#9ccfc9', '#4f8c92'], ink: [240, 255, 250] },
    edgeOpacity: 0.28,
    grid: 6,
    gridOpacity: 0.09,
    faceOpacity: 0,
    rippleOpacity: 0.5,
    bounce: 1.04,
    lit: 0.8,
  },
  dusk: {
    name: 'Dusk',
    backdrop: ['#5a3a5c', '#1a1230'],
    ink: [255, 205, 180],
    day: { backdrop: ['#f0bfa4', '#a6718c'], ink: [255, 246, 235] },
    edgeOpacity: 0.07,
    grid: 0,
    gridOpacity: 0,
    faceOpacity: 0.05,
    rippleOpacity: 0.35,
    bounce: 0.92,
    lit: 0.9,
  },
  frost: {
    name: 'Frost',
    backdrop: ['#1c3350', '#070d1c'],
    ink: [185, 220, 255],
    day: { backdrop: ['#a8c8e2', '#6890b8'], ink: [235, 247, 255] },
    edgeOpacity: 0.1,
    grid: 0,
    gridOpacity: 0,
    faceOpacity: 0,
    rippleOpacity: 0.45,
    bounce: 1.02,
    wall: 'frost',
    lit: 1.1,
  },
  water: {
    name: 'Water',
    backdrop: ['#0c3f56', '#031120'],
    ink: [60, 165, 195],
    day: { backdrop: ['#7fd0d6', '#2f86a6'], ink: [130, 220, 225] },
    edgeOpacity: 0.05,
    grid: 0,
    gridOpacity: 0,
    faceOpacity: 0,
    rippleOpacity: 0.5,
    bounce: 0.9,
    wall: 'water',
    lit: 0.9,
  },
  silk: {
    name: 'Silk',
    backdrop: ['#40203a', '#150a18'],
    ink: [214, 120, 150],
    day: { backdrop: ['#f2d5cf', '#c08f98'], ink: [250, 190, 190] },
    edgeOpacity: 0,
    grid: 0,
    gridOpacity: 0,
    faceOpacity: 0,
    rippleOpacity: 0.3,
    bounce: 0.8,
    wall: 'silk',
    lit: 1.1,
  },
  stone: {
    name: 'Stone',
    backdrop: ['#25262b', '#0a0a0d'],
    ink: [150, 150, 162],
    day: { backdrop: ['#d4cec2', '#8e887d'], ink: [225, 214, 196] },
    edgeOpacity: 0,
    grid: 0,
    gridOpacity: 0,
    faceOpacity: 0,
    rippleOpacity: 0.3,
    bounce: 1,
    wall: 'stone',
    lit: 1.3,
  },
  felt: {
    name: 'Felt',
    backdrop: ['#0f3322', '#04100a'],
    ink: [56, 184, 112],
    day: { backdrop: ['#5f9e78', '#2e6046'], ink: [84, 214, 138] },
    edgeOpacity: 0,
    grid: 0,
    gridOpacity: 0,
    faceOpacity: 0,
    rippleOpacity: 0.35,
    bounce: 0.88,
    wall: 'felt',
    lit: 0.9,
  },
} satisfies Record<string, BoxLook>;

export type EnvironmentId = keyof typeof ENVIRONMENTS;

/** Backdrops. Add an entry and it appears in the tray. */
export const LIGHTS = {
  night: { name: 'Night', day: false },
  day: { name: 'Day', day: true },
};
export type Light = (typeof LIGHTS)[keyof typeof LIGHTS];

/** The middle of the opacity slider leaves a box as designed; softness starts at none. */
export const DEFAULT_WALLS: Walls = { opacity: 0.5, softness: 0 };

/** Soft walls give: they bounce less and their lines thicken and fade. */
export function dress(look: BoxLook, light: Light, walls: Walls): Environment {
  const k = walls.opacity * 2;
  const s = walls.softness;
  return {
    ...look,
    ...(light.day ? look.day : null),
    edgeOpacity: Math.min(1, look.edgeOpacity * k),
    gridOpacity: Math.min(1, look.gridOpacity * k),
    faceOpacity: Math.min(1, look.faceOpacity * k),
    bounce: look.bounce * (1 - 0.3 * s),
    wallOpacity: k,
    softness: s,
  };
}
