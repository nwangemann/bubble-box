import type { Shape } from './shapes';

/** One entrant, drawn on a ball of radius 1, y down. Back to front. */
export type Fighter = {
  name: string;
  /** Ball colour where lit and in shade. Unique within a theme. */
  skin: [string, string];
  /** Behind the ball. */
  back?: Shape[];
  /** On the ball, clipped to it. */
  mark?: Shape[];
  face: Shape[];
  /** Over the face. */
  front?: Shape[];
  hat?: Shape[];
};

/** Where things are in a mural: 1 is half the back wall's width, the middle is 0, y down. */
export type Place = { horizon: number; top: number; bottom: number };

export type Theme = {
  name: string;
  tagline: string;
  /** What the winner is called. */
  title: string;
  /** System font for titles; falls back quietly. */
  font: string;
  accent: string;
  /** "{Winner} {verb} {loser}". */
  verbs: string[];
  /** The box: centre and edge of the backdrop, and 0-255 rgb of its lines. */
  backdrop: [string, string];
  ink: [number, number, number];
  /** Seen faintly on the back wall. */
  mural: (at: Place) => Shape[];
  /** Things floating in the air. `rise` is up when positive. */
  motes: { color: string; size: number; rise: number };
  cast: Fighter[];
};
