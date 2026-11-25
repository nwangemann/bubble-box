/** What showdowns leave behind: who has won how often, and how many wins were called. */
export type Tally = {
  /** By fighter name. */
  wins: Record<string, number>;
  /** Wrong calls are never counted. */
  called: number;
};

export const addWin = (t: Tally, name: string, called: boolean): Tally => ({
  wins: { ...t.wins, [name]: winsOf(t, name) + 1 },
  called: t.called + (called ? 1 : 0),
});

export const winsOf = (t: Tally, name: string): number =>
  Object.hasOwn(t.wins, name) ? t.wins[name]! : 0;

/** 1st, 2nd, 3rd, 4th and so on. */
export function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  return `${n}${(!teen && ['th', 'st', 'nd', 'rd'][n % 10]) || 'th'}`;
}

const count = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) > 0;

export function cleanTally(saved: unknown): Tally {
  const { wins, called } = (saved ?? {}) as { wins?: unknown; called?: unknown };
  const rows = wins && typeof wins === 'object' ? Object.entries(wins) : [];
  return {
    wins: Object.fromEntries(rows.filter((row): row is [string, number] => count(row[1]))),
    called: count(called) ? called : 0,
  };
}
