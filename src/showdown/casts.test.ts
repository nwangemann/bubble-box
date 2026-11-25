import { CAST_CHOICES, castFor, castName, cleanCast, stepCast } from './casts';
import { THEME_IDS } from './index';

test('an arena has its own cast, a chosen one, or any', () => {
  for (const arena of THEME_IDS) {
    expect(castFor('own', arena)).toBe(arena);
    expect(castFor('pirates', arena)).toBe('pirates');
    expect(THEME_IDS).toContain(castFor('random', arena));
  }
});

test('stepping reaches every choice both ways and comes round', () => {
  for (const by of [1, -1]) {
    let at = cleanCast('own');
    const seen = CAST_CHOICES.map(() => (at = stepCast(at, by)));
    expect(new Set(seen).size).toBe(CAST_CHOICES.length);
    expect(at).toBe('own');
  }
  expect(new Set(CAST_CHOICES.map(castName)).size).toBe(CAST_CHOICES.length);
});

test('a saved choice survives, and nonsense falls back', () => {
  expect(cleanCast('space')).toBe('space');
  expect(cleanCast('random')).toBe('random');
  expect(cleanCast('gone')).toBe('own');
  expect(cleanCast(undefined)).toBe('own');
});
