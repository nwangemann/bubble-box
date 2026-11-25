import { ENTRANTS } from '../config/rules';
import { THEMES } from './index';
import type { Shape } from './shapes';

const key = (s?: Shape[]) => JSON.stringify((s ?? []).map((o) => o.d));
const themes = Object.entries(THEMES);

test.each(themes)('%s has a full cast in which nobody looks like anybody else', (_, { cast }) => {
  expect(cast).toHaveLength(ENTRANTS.most);
  const unique = (values: string[]) => expect(new Set(values).size).toBe(values.length);
  unique(cast.map((f) => f.name));
  unique(cast.map((f) => f.skin[0]));
  unique(cast.map((f) => f.skin[1]));
  unique(cast.map((f) => key(f.face)));
  const hats = cast.filter((f) => f.hat);
  unique(hats.map((f) => key(f.hat)));
  // Anybody without a hat has a shape or markings of their own.
  unique(cast.map((f) => key([...(f.hat ?? []), ...(f.back ?? []), ...(f.mark ?? [])])));
});

test('no name appears in two arenas', () => {
  const names = themes.flatMap(([, t]) => t.cast.map((f) => f.name));
  expect(new Set(names).size).toBe(names.length);
});

test.each(themes)('%s draws only numbers it can draw', (_, theme) => {
  const all = [
    ...theme.scenery({ horizon: 1.24, top: -2.17, bottom: 2.17 }),
    ...theme.cast.flatMap((f) => [
      ...(f.back ?? []),
      ...(f.mark ?? []),
      ...f.face,
      ...(f.front ?? []),
      ...(f.hat ?? []),
    ]),
  ];
  for (const s of all) {
    expect(s.d).toMatch(/^M[-\d. MmLlHhVvCcSsQqTtAaZze]+$/);
    for (const c of [s.fill, s.line]) if (c) expect(c).toMatch(/^#([\da-f]{6}|[\da-f]{8})$/i);
  }
});
