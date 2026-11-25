/** What bubbles do when they touch. Add an entry and it appears in the tray. */
export type Contact = { name: string; merges: boolean };

export const CONTACTS = {
  bounce: { name: 'Bounce', merges: false },
  merge: { name: 'Merge', merges: true },
} satisfies Record<string, Contact>;

export type ContactId = keyof typeof CONTACTS;
