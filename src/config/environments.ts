/** The box. Add an entry and it appears in the tray. */
export type Environment = {
  name: string;
  /** Centre and edge of the backdrop gradient. */
  backdrop: [string, string];
  /** Line and ripple colour as 0-255 rgb. */
  ink: [number, number, number];
  edgeOpacity: number;
  /** Cells per wall; 0 for none. */
  grid: number;
  gridOpacity: number;
  faceOpacity: number;
  rippleOpacity: number;
  /** Multiplies the feel's restitution. */
  bounce: number;
};

export const ENVIRONMENTS = {
  invisible: {
    name: 'Invisible',
    backdrop: ['#141a38', '#05070f'],
    ink: [190, 205, 255],
    edgeOpacity: 0,
    grid: 0,
    gridOpacity: 0,
    faceOpacity: 0,
    rippleOpacity: 0.3,
    bounce: 1,
  },
  whisper: {
    name: 'Whisper',
    backdrop: ['#1b2036', '#080a14'],
    ink: [200, 215, 255],
    edgeOpacity: 0.16,
    grid: 0,
    gridOpacity: 0,
    faceOpacity: 0.015,
    rippleOpacity: 0.4,
    bounce: 1,
  },
  lattice: {
    name: 'Lattice',
    backdrop: ['#0d2430', '#03090e'],
    ink: [130, 235, 225],
    edgeOpacity: 0.28,
    grid: 6,
    gridOpacity: 0.09,
    faceOpacity: 0,
    rippleOpacity: 0.5,
    bounce: 1.04,
  },
  dusk: {
    name: 'Dusk',
    backdrop: ['#5a3a5c', '#1a1230'],
    ink: [255, 205, 180],
    edgeOpacity: 0.07,
    grid: 0,
    gridOpacity: 0,
    faceOpacity: 0.05,
    rippleOpacity: 0.35,
    bounce: 0.92,
  },
} satisfies Record<string, Environment>;

export type EnvironmentId = keyof typeof ENVIRONMENTS;
