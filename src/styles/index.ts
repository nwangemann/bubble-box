import { aurora, lantern, tide } from './obvious';
import { contour, chrome, eclipse, ink, medusa, nebula } from './experimental';
import { glass, pearl, soap } from './standard';

export type BubbleStyle = {
  name: string;
  group: 'standard' | 'obvious' | 'experimental';
  sksl: string;
};

/** Add an entry and it appears in the tray. */
export const STYLES = {
  soap: { name: 'Soap', group: 'standard', sksl: soap },
  glass: { name: 'Glass', group: 'standard', sksl: glass },
  pearl: { name: 'Pearl', group: 'standard', sksl: pearl },
  lantern: { name: 'Lantern', group: 'obvious', sksl: lantern },
  aurora: { name: 'Aurora', group: 'obvious', sksl: aurora },
  tide: { name: 'Tide', group: 'obvious', sksl: tide },
  nebula: { name: 'Nebula', group: 'experimental', sksl: nebula },
  ink: { name: 'Ink', group: 'experimental', sksl: ink },
  chrome: { name: 'Mercury', group: 'experimental', sksl: chrome },
  contour: { name: 'Contour', group: 'experimental', sksl: contour },
  eclipse: { name: 'Eclipse', group: 'experimental', sksl: eclipse },
  medusa: { name: 'Medusa', group: 'experimental', sksl: medusa },
} satisfies Record<string, BubbleStyle>;

export type StyleId = keyof typeof STYLES;
