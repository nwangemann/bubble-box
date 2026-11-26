# 4. expo-audio for synthesised tones

Status: accepted, 2026-11-25

## Decision

`expo-audio` plays every sound. Tones are synthesised in JavaScript at start (`services/synth`: a few sine partials under a soft envelope), written to the cache as 16-bit WAV files, and loaded into a few players each (`SOUND.voices`), so they overlap. Pitch comes from the playback rate with pitch correction off, an octave each way (`SOUND.slowest`, `fastest`).

The audio session is ambient (`playsInSilentMode: false`, `mixWithOthers`): the silent switch silences it, and it never stops or ducks the user's music. No microphone permission and no background audio (`app.json`).

The web preview is silent: a browser has no silent switch to follow.

## Why

It is the supported Expo module for playback, needs no licensed audio, and the files are made once, so nothing is synthesised while playing. A few sine partials are enough for soft tones; anything recorded can be added later as an asset in the same players.

## Alternatives

| Option                       | Why not                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `react-native-audio-api`     | Real-time synthesis, but a large native engine for a handful of tones        |
| `expo-av`                    | Deprecated in favour of `expo-audio`                                         |
| Licensed or recorded samples | Licensing, and a size or pitch range fixed when recorded; can still be added |
| A native module of our own   | More code than the job needs                                                 |

## Revisit if

Tones must change while sounding (a slide in pitch, a filter that follows speed), latency from touch to sound is felt on a phone, or more than about 8 tones sound at once.
