/**
 * MADFAM Golden Ratio Design Tokens
 *
 * The golden ratio (φ ≈ 1.618) creates naturally harmonious proportions.
 * These tokens are used across the Dhanam UI for consistent,
 * aesthetically pleasing spacing, typography, and proportions.
 *
 * Mathematical basis:
 * - φ (phi) = 1.618033988749895
 * - φ² = 2.618033988749895
 * - φ³ = 4.236067977499790
 * - 1/φ = 0.618033988749895
 * - 1/φ² = 0.381966011250105
 */

// The golden ratio constant
export const PHI = 1.618033988749895;

// Inverse golden ratio (useful for smaller scales)
export const PHI_INVERSE = 1 / PHI; // ≈ 0.618

/**
 * Golden Ratio Spacing Scale
 *
 * Base unit: 1rem (16px)
 * Each step multiplies/divides by φ
 *
 * Usage in Tailwind: spacing-phi-md, p-phi-lg, m-phi-xl, etc.
 */
export const goldenSpacing = {
  // Smaller than base (dividing by φ)
  'phi-3xs': `${1 / PHI / PHI / PHI}rem`, // 0.236rem (~4px)
  'phi-2xs': `${1 / PHI / PHI}rem`, // 0.382rem (~6px)
  'phi-xs': `${1 / PHI}rem`, // 0.618rem (~10px)

  // Base
  'phi-sm': '0.75rem', // 12px (bridge value)
  'phi-md': '1rem', // 16px - base unit
  'phi-base': '1rem', // alias

  // Larger than base (multiplying by φ)
  'phi-lg': `${PHI}rem`, // 1.618rem (~26px)
  'phi-xl': `${PHI * PHI}rem`, // 2.618rem (~42px)
  'phi-2xl': `${PHI * PHI * PHI}rem`, // 4.236rem (~68px)
  'phi-3xl': `${PHI * PHI * PHI * PHI}rem`, // 6.854rem (~110px)
} as const;

/**
 * Golden Ratio Typography Scale
 *
 * Font sizes follow the golden ratio progression.
 * Line heights are calculated for optimal readability (typically 1.5-1.618x font size)
 *
 * Usage in Tailwind: text-phi-base, text-phi-lg, etc.
 */
export const goldenTypography = {
  'phi-3xs': ['0.512rem', { lineHeight: '0.75rem' }], // ~8px
  'phi-2xs': ['0.618rem', { lineHeight: '1rem' }], // ~10px
  'phi-xs': ['0.75rem', { lineHeight: '1.125rem' }], // 12px
  'phi-sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
  'phi-base': ['1rem', { lineHeight: `${PHI}rem` }], // 16px / 26px
  'phi-lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
  'phi-xl': [`${PHI}rem`, { lineHeight: '2.25rem' }], // ~26px
  'phi-2xl': ['2rem', { lineHeight: '2.5rem' }], // 32px
  'phi-3xl': [`${PHI * PHI}rem`, { lineHeight: '3rem' }], // ~42px
  'phi-4xl': [`${PHI * PHI * PHI}rem`, { lineHeight: '1' }], // ~68px
} as const;

/**
 * Golden Ratio Border Radius
 *
 * Rounded corners following golden proportions for visual harmony.
 *
 * Usage in Tailwind: rounded-phi, rounded-phi-lg, etc.
 */
export const goldenBorderRadius = {
  'phi-none': '0',
  'phi-sm': `${1 / PHI / PHI}rem`, // 0.382rem (~6px)
  phi: `${1 / PHI}rem`, // 0.618rem (~10px)
  'phi-md': '0.75rem', // 12px (bridge)
  'phi-lg': '1rem', // 16px
  'phi-xl': `${PHI}rem`, // 1.618rem (~26px)
  'phi-2xl': `${PHI * PHI}rem`, // 2.618rem (~42px)
  'phi-full': '9999px',
} as const;

/**
 * Golden Ratio Sizing (Width/Height)
 *
 * For creating golden rectangle proportions in layouts.
 *
 * Usage: A container with width: phi-container and height: phi-container-h
 * will have golden ratio proportions.
 */
export const goldenSizing = {
  // Common golden rectangles (width)
  'phi-card-sm': '16rem', // 256px
  'phi-card': `${16 * PHI}rem`, // ~410px
  'phi-card-lg': `${16 * PHI * PHI}rem`, // ~664px

  // Container widths
  'phi-container-sm': '32rem', // 512px
  'phi-container': `${32 * PHI}rem`, // ~830px
  'phi-container-lg': `${32 * PHI * PHI}rem`, // ~1340px

  // Aspect ratio helpers (for height calculation)
  'phi-ratio': `${PHI}`,
  'phi-ratio-inverse': `${1 / PHI}`,
} as const;

/**
 * Golden Ratio Shadows
 *
 * Box shadows with golden-proportioned blur and spread.
 */
export const goldenShadows = {
  'phi-sm': `0 ${1 / PHI / PHI}rem ${1 / PHI}rem rgba(0, 0, 0, 0.05)`,
  phi: `0 ${1 / PHI}rem ${1}rem rgba(0, 0, 0, 0.1)`,
  'phi-md': `0 ${1}rem ${PHI}rem rgba(0, 0, 0, 0.1)`,
  'phi-lg': `0 ${PHI}rem ${PHI * PHI}rem rgba(0, 0, 0, 0.1)`,
  'phi-xl': `0 ${PHI * PHI}rem ${PHI * PHI * PHI}rem rgba(0, 0, 0, 0.1)`,
} as const;

/**
 * Golden Ratio Animation Durations
 *
 * Timing that feels natural to the human eye.
 * Base: 200ms, scaled by φ
 */
export const goldenDurations = {
  'phi-instant': '100ms',
  'phi-fast': `${200 / PHI}ms`, // ~124ms
  'phi-base': '200ms',
  'phi-normal': `${200 * PHI}ms`, // ~324ms
  'phi-slow': `${200 * PHI * PHI}ms`, // ~524ms
  'phi-slower': `${200 * PHI * PHI * PHI}ms`, // ~847ms
} as const;

/**
 * Golden Grid System
 *
 * Column widths and gaps based on golden proportions.
 */
export const goldenGrid = {
  // Gap sizes
  'gap-phi-xs': goldenSpacing['phi-xs'],
  'gap-phi-sm': goldenSpacing['phi-sm'],
  'gap-phi': goldenSpacing['phi-md'],
  'gap-phi-lg': goldenSpacing['phi-lg'],
  'gap-phi-xl': goldenSpacing['phi-xl'],

  // Golden split (for two-column layouts)
  // Main content: 61.8%, Sidebar: 38.2%
  'col-phi-main': '61.8%',
  'col-phi-side': '38.2%',
} as const;

/**
 * Tailwind CSS Plugin Configuration
 *
 * Extend your tailwind.config.js with these tokens:
 *
 * ```js
 * import { goldenRatioPlugin } from '@dhanam-core/ui/tokens';
 *
 * export default {
 *   theme: {
 *     extend: goldenRatioPlugin.theme,
 *   },
 * };
 * ```
 */
export const goldenRatioTailwindExtend = {
  spacing: goldenSpacing,
  fontSize: goldenTypography,
  borderRadius: goldenBorderRadius,
  boxShadow: goldenShadows,
  transitionDuration: goldenDurations,
  width: goldenSizing,
  maxWidth: {
    'phi-sm': goldenSizing['phi-container-sm'],
    phi: goldenSizing['phi-container'],
    'phi-lg': goldenSizing['phi-container-lg'],
  },
} as const;

/**
 * CSS Custom Properties
 *
 * For use in CSS files or style blocks:
 * ```css
 * .element {
 *   padding: var(--phi-md);
 *   border-radius: var(--phi-radius);
 * }
 * ```
 */
export const goldenCSSVariables = `
:root {
  /* Golden Ratio Constants */
  --phi: ${PHI};
  --phi-inverse: ${PHI_INVERSE};

  /* Spacing */
  --phi-3xs: ${goldenSpacing['phi-3xs']};
  --phi-2xs: ${goldenSpacing['phi-2xs']};
  --phi-xs: ${goldenSpacing['phi-xs']};
  --phi-sm: ${goldenSpacing['phi-sm']};
  --phi-md: ${goldenSpacing['phi-md']};
  --phi-lg: ${goldenSpacing['phi-lg']};
  --phi-xl: ${goldenSpacing['phi-xl']};
  --phi-2xl: ${goldenSpacing['phi-2xl']};
  --phi-3xl: ${goldenSpacing['phi-3xl']};

  /* Border Radius */
  --phi-radius-sm: ${goldenBorderRadius['phi-sm']};
  --phi-radius: ${goldenBorderRadius['phi']};
  --phi-radius-md: ${goldenBorderRadius['phi-md']};
  --phi-radius-lg: ${goldenBorderRadius['phi-lg']};
  --phi-radius-xl: ${goldenBorderRadius['phi-xl']};

  /* Shadows */
  --phi-shadow-sm: ${goldenShadows['phi-sm']};
  --phi-shadow: ${goldenShadows['phi']};
  --phi-shadow-md: ${goldenShadows['phi-md']};
  --phi-shadow-lg: ${goldenShadows['phi-lg']};

  /* Animation */
  --phi-duration-fast: ${goldenDurations['phi-fast']};
  --phi-duration: ${goldenDurations['phi-base']};
  --phi-duration-normal: ${goldenDurations['phi-normal']};
  --phi-duration-slow: ${goldenDurations['phi-slow']};

  /* Grid */
  --phi-col-main: ${goldenGrid['col-phi-main']};
  --phi-col-side: ${goldenGrid['col-phi-side']};
}
`;

// Default export for convenience
export default {
  PHI,
  PHI_INVERSE,
  spacing: goldenSpacing,
  typography: goldenTypography,
  borderRadius: goldenBorderRadius,
  sizing: goldenSizing,
  shadows: goldenShadows,
  durations: goldenDurations,
  grid: goldenGrid,
  tailwindExtend: goldenRatioTailwindExtend,
  cssVariables: goldenCSSVariables,
};
