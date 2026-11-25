import { addWin, cleanTally, ordinal, winsOf } from './tally';

test('counts wins by name, and right calls only', () => {
  let t = cleanTally(null);
  t = addWin(t, 'Pie', false);
  t = addWin(t, 'Pie', true);
  t = addWin(t, 'Ghost', false);
  expect(t).toEqual({ wins: { Pie: 2, Ghost: 1 }, called: 1 });
  expect(winsOf(t, 'constructor')).toBe(0);
});

test('a saved tally comes back whole; anything unreadable is dropped', () => {
  const t = addWin(cleanTally(undefined), 'Pie', true);
  expect(cleanTally(JSON.parse(JSON.stringify(t)))).toEqual(t);
  expect(cleanTally({ wins: { Pie: 2, Ghost: 'many', Egg: -1 }, called: 1.5 })).toEqual({
    wins: { Pie: 2 },
    called: 0,
  });
  expect(cleanTally({ wins: 'none' })).toEqual({ wins: {}, called: 0 });
});

test('ordinals', () => {
  expect([1, 2, 3, 4, 11, 12, 13, 21, 102, 111].map(ordinal)).toEqual(
    '1st 2nd 3rd 4th 11th 12th 13th 21st 102nd 111th'.split(' '),
  );
});
