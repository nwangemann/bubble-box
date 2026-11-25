/**
 * What bubbles leave behind them: a strip along the path, or images set down along it. Add an entry,
 * with its shader in `scene/trails`.
 */
export type TrailLook = {
  id: string;
  name: string;
  /** How long each part of it lasts. */
  seconds: number;
  /** Half its width where it begins, against the bubble's radius. For images, their radius. */
  width: number;
  /** Opacity at its strongest. */
  strength: number;
  /** Makes it images rather than a strip: how far apart, in radii. */
  gap?: number;
  /** Full from this many radii from its bubble, rather than `TUNING.trail.shown`. */
  shown?: number;
};

export const TRAILS = {
  ribbon: { id: 'ribbon', name: 'Ribbon', seconds: 2.6, width: 0.32, strength: 0.85 },
  light: { id: 'light', name: 'Light', seconds: 3.2, width: 0.6, strength: 0.9 },
  echo: { id: 'echo', name: 'Echo', seconds: 2.2, width: 0.96, strength: 0.6, gap: 0.8 },
} satisfies Record<string, TrailLook>;

export type TrailId = keyof typeof TRAILS;
