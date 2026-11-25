import { FEAT } from '../config/feats';
import { RULES } from '../config/rules';
import { featsOf } from './feats';
import { createShowdown } from './showdown';

/** A finished showdown in which bubble 1 won the clashes marked `1`. */
const won = (wins: string, o: { seconds?: number; odds?: number; count?: number } = {}) => {
  const { seconds = (FEAT.quick + FEAT.slow) / 2, odds = 1, count = wins.length + 1 } = o;
  const box = { hw: 1, hh: 2.17, depth: 2.4, focal: 3.2 };
  const duel = createShowdown(box, RULES.even, count).duel!;
  duel.phase = 'won';
  duel.champion = 1;
  duel.log = [...wins].map((c, i) => ({
    winner: c === '1' ? 1 : 2,
    seconds: (seconds * (i + 1)) / wins.length,
    odds,
  }));
  duel.wins[1] = [...wins].filter((c) => c === '1').length;
  return featsOf(duel);
};

test.each([
  ['an ordinary win', '00100100101', {}, []],
  ['only the last clash', '00000000001', {}, ['lone']],
  ['a late start', '00000000011', {}, ['late']],
  ['first and last', '10010000001', {}, ['first']],
  ['a run', '00111110001', {}, ['streak']],
  ['a run that was broken', '00111101001', {}, []],
  ['a much larger last rival', '00100100101', { odds: FEAT.giant }, ['giant']],
  ['a short one', '00100100101', { seconds: FEAT.quick }, ['quick']],
  ['a long one', '00100100101', { seconds: FEAT.slow }, ['slow']],
])('notices %s', (_, wins, o, feats) => {
  expect(won(wins, o)).toEqual(feats);
});

test('titles stack when several fit', () => {
  expect(won('11111111111', { seconds: 5 })).toEqual(['army', 'quick', 'streak', 'first']);
});

test('few entrants earn none', () => {
  expect(won('1')).toEqual([]);
  expect(won('0001')).toEqual([]);
});

test('a called win has a title, and a raging one another', () => {
  const duel = createShowdown({ hw: 1, hh: 2.17, depth: 2.4, focal: 3.2 }, RULES.even, 12).duel!;
  duel.phase = 'won';
  duel.champion = duel.favourite = 1;
  duel.log = [...'00100100101'].map((c) => ({ winner: c === '1' ? 1 : 2, seconds: 12, odds: 1 }));
  duel.wins[1] = 4;
  expect(featsOf(duel)).toEqual(['called']);
  duel.rage = true;
  expect(featsOf(duel)).toEqual(['rage']);
  duel.favourite = 2;
  expect(featsOf(duel)).toEqual([]);
});
