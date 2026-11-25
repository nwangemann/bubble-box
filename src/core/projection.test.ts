import { awayAt } from './projection';

const box = { hw: 1, hh: 2, depth: 2, focal: 2 };

test('distance is clear near the glass and full at the back wall', () => {
  expect(awayAt(box, 0, 0.25)).toBe(0);
  expect(awayAt(box, 0.5, 0.25)).toBe(0);
  expect(awayAt(box, 2, 0.25)).toBe(1);
  expect(awayAt(box, 3, 0.25)).toBe(1);
});

test('distance grows steadily in between', () => {
  expect(awayAt(box, 1.25, 0.25)).toBeCloseTo(0.5);
});
