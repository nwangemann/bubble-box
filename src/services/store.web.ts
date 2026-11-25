const KEY = 'settings';

/** What was saved, read at once, or null. */
export const read = (): string | null => localStorage.getItem(KEY);

export const write = (text: string) => localStorage.setItem(KEY, text);
