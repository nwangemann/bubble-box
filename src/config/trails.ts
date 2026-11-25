/** What bubbles leave behind them. Add an entry, with its shader in `scene/trails`. */
export type TrailLook = {
  id: string;
  name: string;
  /** How long each part of it lasts. */
  seconds: number;
  /** Half its width where it begins, against the bubble's radius. */
  width: number;
  /** Opacity at its strongest. */
  strength: number;
};

export const TRAILS = {
  ribbon: { id: 'ribbon', name: 'Ribbon', seconds: 2.6, width: 0.32, strength: 0.85 },
} satisfies Record<string, TrailLook>;

export type TrailId = keyof typeof TRAILS;
