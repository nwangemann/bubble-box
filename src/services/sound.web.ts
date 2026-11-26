import type { ToneId } from '@/config/sound';

// The web preview is silent: a browser has no silent switch to follow. See ADR 4.

export async function prepareSound() {}

export function playTone(_id: ToneId, _volume = 1, _rate = 1) {}

export function soundStatus(): { id: ToneId; voices: number; loaded: boolean; seconds: number }[] {
  return [];
}
