/** What a quick tap on a bubble does. Add an entry and it appears in the tray. */
export type Tap = { name: string; pops: boolean };

export const TAPS = {
  pop: { name: 'Pop', pops: true },
  grow: { name: 'New bubble', pops: false },
} satisfies Record<string, Tap>;

export type TapId = keyof typeof TAPS;
