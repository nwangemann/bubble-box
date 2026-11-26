import { VOICING } from '@/config/sound';
import { playTone } from './sound';
import { potVoice, rateOfSize, volumeOfImpact } from './synth';

/** A bubble meets a wall or the glass. */
let lastBounce = 0;
export const soundBounce = (r: number, impact: number) => {
  const B = VOICING.bubble;
  const now = performance.now() / 1000;
  if (now - lastBounce < B.gap) return;
  lastBounce = now;
  playTone('chime', volumeOfImpact(impact), rateOfSize(r, B.radius, B.per));
};

/** A bubble pops. */
export const soundPop = (r: number) => {
  const P = VOICING.pop;
  playTone('pop', P.volume, rateOfSize(r, P.radius, P.per));
};

/** A ball drops into a pocket. */
export const soundPot = (
  weight: number,
  meaning: { foul: number; last: number; eight: number },
) => {
  const v = potVoice(weight, meaning);
  playTone('pot', v.volume, v.rate);
};
