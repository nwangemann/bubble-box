import { TUNING } from '../config/tuning';

export type Rect = { x: number; y: number; width: number; height: number };

const P = TUNING.preview;

/** Cells for every option on one screen, centred, with no scrolling. `foot` is kept free below. */
export function layoutCells(count: number, width: number, height: number, foot = 0): Rect[] {
  const columns = count > P.wideUpTo ? 3 : 2;
  const rows = Math.ceil(count / columns);
  const w = (width - P.side * 2 - P.gap * (columns - 1)) / columns;
  const room = height - P.top - P.bottom - foot;
  const each = Math.min(room / rows, w * P.tallest + P.label);
  const top = P.top + (room - each * rows) / 2;
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / columns);
    // A short last row sits in the middle.
    const inRow = Math.min(columns, count - row * columns);
    const indent = ((columns - inRow) * (w + P.gap)) / 2;
    return {
      x: P.side + indent + (i % columns) * (w + P.gap),
      y: top + row * each,
      width: w,
      height: each - P.label,
    };
  });
}
