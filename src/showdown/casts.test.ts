import { ENTRANTS } from '../config/rules';
import {
  alike,
  CAST_CHOICES,
  castFor,
  castName,
  cleanCast,
  crewOf,
  mostOf,
  stepCast,
} from './casts';
import { THEME_IDS, THEMES } from './index';

test('an arena has its own cast, a chosen one, or any', () => {
  for (const arena of THEME_IDS) {
    expect(castFor('own', arena)).toBe(arena);
    expect(castFor('pirates', arena)).toBe('pirates');
    expect(castFor('mixed', arena)).toBe('mixed');
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

test('a theme brings its whole cast', () => {
  const crew = crewOf('pirates', 5);
  expect(crew.map((m) => m.fighter)).toEqual(THEMES.pirates.cast);
});

test('a mixed cast is full, dealt evenly, and nobody is twice or alike', () => {
  for (let round = 0; round < 50; round++)
    for (const n of [ENTRANTS.least, 7, ENTRANTS.most, ENTRANTS.mixed]) {
      const crew = crewOf('mixed', n);
      expect(crew).toHaveLength(n);
      expect(new Set(crew.map((m) => m.fighter.name)).size).toBe(n);
      crew.forEach((a, i) => {
        expect(a.home.cast).toContain(a.fighter);
        crew.slice(i + 1).forEach((b) => expect(alike(a.fighter, b.fighter)).toBe(false));
      });
      const each = THEME_IDS.map((id) => crew.filter((m) => m.home === THEMES[id]).length);
      expect(Math.max(...each) - Math.min(...each)).toBeLessThanOrEqual(1);
    }
});

test('only a mixed cast lets in more than a theme has', () => {
  for (const c of CAST_CHOICES)
    expect(mostOf(c)).toBe(c === 'mixed' ? ENTRANTS.mixed : ENTRANTS.most);
});
