import { food } from './food';
import { haunted } from './haunted';
import { medieval } from './medieval';
import { pirates } from './pirates';
import { space } from './space';
import { western } from './western';
import type { Theme } from './types';

/** Add an entry and it appears in the tray and the showdown chooser. */
export const THEMES = { medieval, western, space, pirates, haunted, food } satisfies Record<
  string,
  Theme
>;
export type ThemeId = keyof typeof THEMES;
export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
