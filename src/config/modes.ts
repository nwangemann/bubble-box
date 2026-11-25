import type { ThemeId } from '../showdown';

export type Mode = 'calm' | 'showdown';

/**
 * The switch at the foot of the menu. `bottom` sits it just above the dot, in the menu and the
 * chooser alike. Pixels, except bubbles: shares of a side's width across and of its height down, with
 * `r` in shares of its height.
 */
export const MODE_SWITCH = {
  height: 76,
  width: 340,
  /** Least room left above the menu, before its rows scroll. */
  above: 24,
  bottom: 72,
  corner: 38,
  inset: 4,
  /** Opacity of the side that is off. */
  off: 0.8,
  calm: {
    sky: ['#3a5f9c', '#1b2c5c', '#0c1434'],
    bubbles: [
      { x: 0.78, y: 0.4, r: 0.31 },
      { x: 0.55, y: 0.22, r: 0.12 },
      { x: 0.92, y: 0.82, r: 0.09 },
    ],
  },
  showdown: {
    sky: ['#ffd76a', '#f0542d', '#64143c', '#260a2c'],
    theme: 'medieval' as ThemeId,
    /** The two who clash, by place in the cast; they touch at the middle of `at`. */
    fighters: [0, 8],
    at: { x: 0.5, y: 0.36, r: 0.29 },
    rays: 18,
  },
} as const;
