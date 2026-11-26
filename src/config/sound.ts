/** One synthesised tone: a few sine partials under a soft envelope. */
export type Tone = {
  /** Pitch of the first partial, in Hz. */
  hz: number;
  /** Whole length, in seconds. */
  seconds: number;
  /** Rise from silence, in seconds. Long enough that it never clicks. */
  attack: number;
  /** How fast it dies away after the attack: amplitude falls by e every `decay` seconds. */
  decay: number;
  /** [multiple of `hz`, loudness] for each partial. */
  partials: readonly (readonly [number, number])[];
  /** Peak level, 0 to 1. */
  level: number;
};

export const SOUND = {
  /** Samples per second of every synthesised tone. */
  rate: 44100,
  /** Players per tone, so that tones overlap rather than cut each other off. */
  voices: 4,
  /** Fade out over the last seconds of a tone, so it ends in silence. */
  release: 0.04,
  /** Highest and lowest playback rates asked of a player: an octave each way. */
  fastest: 2,
  slowest: 0.5,
} as const;

/** The tones the app can play, each pitched by size or meaning (`services/tones`). */
export const TONES = {
  /** A soft, glassy chime: the base every bubble's tone is pitched from. */
  chime: {
    hz: 523.25,
    seconds: 1.2,
    attack: 0.012,
    decay: 0.35,
    partials: [
      [1, 1],
      [2.76, 0.18],
      [5.4, 0.05],
    ],
    level: 0.5,
  },
  /** A film giving way: brief and airy, with no ring after it. */
  pop: {
    hz: 783.99,
    seconds: 0.35,
    attack: 0.006,
    decay: 0.07,
    partials: [
      [1, 1],
      [1.5, 0.3],
      [3.1, 0.08],
    ],
    level: 0.45,
  },
  /** A ball settling into a pocket: low and round, a bowl struck softly. */
  pot: {
    hz: 261.63,
    seconds: 1.8,
    attack: 0.02,
    decay: 0.6,
    partials: [
      [1, 1],
      [2, 0.25],
      [3.01, 0.08],
      [4.2, 0.04],
    ],
    level: 0.55,
  },
} satisfies Record<string, Tone>;

export type ToneId = keyof typeof TONES;

/**
 * How tones follow what makes them. Every pitch is snapped to a major pentatonic scale on the tone's
 * own note, so tones that sound together never clash.
 */
export const VOICING = {
  /** Semitones of the scale, within an octave. */
  scale: [0, 2, 4, 7, 9],
  bubble: {
    /** A bubble of this radius sounds the tone as made; pitch halves (an octave down) each `per` times larger. */
    radius: 0.2,
    per: 3.2,
    /** Impact at the wall that is just heard, and one that is at full volume. */
    softest: 0.35,
    loudest: 2.4,
    /** Volume of the softest and the loudest. */
    quiet: 0.18,
    full: 0.7,
    /** Seconds between wall tones at least, so a busy room stays a few soft notes, not a rattle. */
    gap: 0.14,
  },
  pop: {
    /** As for the bubble, but a pop is one level. */
    radius: 0.2,
    per: 3.2,
    volume: 0.5,
  },
  pot: {
    /** Semitones up from the tone as made, by what it means (`POOL.pot.meaning`): a foul is lower. */
    foul: -5,
    plain: 0,
    last: 4,
    eight: 7,
    /** Volume of a plain pot; a foul is quieter, the last of a group and the 8 louder. */
    volume: 0.6,
    foulVolume: 0.35,
    brightVolume: 0.8,
  },
} as const;

/** The one Sound choice, a tile in the calm menu and in 8-ball's. Ids are saved. */
export const SOUND_CHOICE = {
  label: 'Sound',
  options: [
    { id: 'off', name: 'Off' },
    { id: 'tones', name: 'Tones' },
  ],
  usual: 'off',
} as const;

export type SoundChoice = (typeof SOUND_CHOICE.options)[number]['id'];

/** A saved choice that still exists, or the usual one. */
export const cleanSound = (saved: unknown): SoundChoice =>
  SOUND_CHOICE.options.find((o) => o.id === saved)?.id ?? SOUND_CHOICE.usual;

/** The choice after `now`, as a tap on its tile steps. */
export const nextSound = (now: SoundChoice): SoundChoice => (now === 'off' ? 'tones' : 'off');

export const soundName = (now: SoundChoice) => SOUND_CHOICE.options.find((o) => o.id === now)!.name;
