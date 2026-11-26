import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { SOUND, TONES, type ToneId } from '@/config/sound';
import { rateOf, samplesOf, wavOf } from './synth';

/** Each tone's players, and which plays next. */
const voices = new Map<ToneId, { players: AudioPlayer[]; next: number }>();

/**
 * Synthesise every tone into the cache and load its players. Call once at start.
 * The audio session is ambient: it mixes with other apps and is silenced by the
 * silent switch.
 */
export async function prepareSound() {
  if (voices.size) return;
  await setAudioModeAsync({
    playsInSilentMode: false,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
    allowsRecording: false,
  });
  for (const id of Object.keys(TONES) as ToneId[]) {
    const f = new File(Paths.cache, `tone-${id}.wav`);
    if (f.exists) f.delete();
    f.create();
    f.write(wavOf(samplesOf(TONES[id])));
    const players = Array.from({ length: SOUND.voices }, () => {
      const p = createAudioPlayer(f.uri);
      p.shouldCorrectPitch = false;
      return p;
    });
    voices.set(id, { players, next: 0 });
  }
}

/** Play a tone at `volume` (0 to 1), its pitch scaled by `rate`. Does nothing before it is prepared. */
export function playTone(id: ToneId, volume = 1, rate = 1) {
  const v = voices.get(id);
  if (!v) return;
  const p = v.players[v.next];
  v.next = (v.next + 1) % v.players.length;
  if (!p) return;
  p.volume = Math.max(0, Math.min(1, volume));
  p.setPlaybackRate(rateOf(rate));
  p.seekTo(0).catch(() => {});
  p.play();
}

/** How each tone's first player stands, for checks. */
export function soundStatus() {
  return [...voices].map(([id, v]) => ({
    id,
    voices: v.players.length,
    loaded: v.players.every((p) => p.isLoaded),
    seconds: v.players[0]?.duration ?? 0,
  }));
}
