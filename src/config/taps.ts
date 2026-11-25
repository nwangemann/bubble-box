/** What a quick tap on a bubble does. Add an entry and it appears in the tray. */
export type Tap = { name: string; pops: boolean };

export const TAPS = {
  grow: { name: 'New bubble', pops: false },
  pop: { name: 'Pop', pops: true },
} satisfies Record<string, Tap>;

export type TapId = keyof typeof TAPS;
