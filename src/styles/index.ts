import { aurora, lantern, tide } from './obvious';
import { contour, chrome, eclipse, ink, medusa, nebula } from './experimental';
import { custom } from './custom';
import { glass, pearl, soap } from './standard';

export type BubbleStyle = {
  /** Colour it lends to effects. */ tint: [number, number, number];
  name: string;
  /** Light it casts on the walls, 0 to 1. */ glow?: number;
  group: 'standard' | 'obvious' | 'experimental';
  sksl: string;
};

/** Add an entry and it appears in the tray. */
export const STYLES = {
  soap: { name: 'Soap', tint: [0.5, 0.8, 1], group: 'standard', sksl: soap },
  glass: { name: 'Glass', tint: [0.7, 0.88, 1], group: 'standard', sksl: glass },
  pearl: { name: 'Pearl', tint: [1, 0.75, 0.85], group: 'standard', sksl: pearl },
  lantern: { name: 'Lantern', glow: 1, tint: [1, 0.55, 0.2], group: 'obvious', sksl: lantern },
  aurora: { name: 'Aurora', glow: 0.6, tint: [0.25, 1, 0.65], group: 'obvious', sksl: aurora },
  tide: { name: 'Tide', glow: 0.25, tint: [0.15, 0.75, 0.95], group: 'obvious', sksl: tide },
  nebula: {
    name: 'Nebula',
    glow: 0.5,
    tint: [0.95, 0.3, 0.8],
    group: 'experimental',
    sksl: nebula,
  },
  ink: { name: 'Ink', tint: [0.95, 0.3, 0.35], group: 'experimental', sksl: ink },
  chrome: { name: 'Mercury', tint: [0.85, 0.8, 1], group: 'experimental', sksl: chrome },
  contour: { name: 'Contour', tint: [1, 0.8, 0.55], group: 'experimental', sksl: contour },
  eclipse: {
    name: 'Eclipse',
    glow: 0.7,
    tint: [1, 0.5, 0.25],
    group: 'experimental',
    sksl: eclipse,
  },
  medusa: { name: 'Medusa', glow: 0.5, tint: [0.35, 0.55, 1], group: 'experimental', sksl: medusa },
  // Made in ui/Maker. Its tint follows the chosen colours; this one is only a stand-in.
  custom: { name: 'Custom', glow: 0.35, tint: [0.7, 0.8, 1], group: 'standard', sksl: custom },
} satisfies Record<string, BubbleStyle>;

export type StyleId = keyof typeof STYLES;
