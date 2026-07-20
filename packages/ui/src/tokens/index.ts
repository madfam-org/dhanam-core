/**
 * DHANAM Design Tokens
 *
 * Golden ratio-based design tokens and semantic colors for consistent, harmonious UI.
 */

// Golden ratio primitives and calculations
export {
  PHI,
  PHI_INVERSE,
  goldenSpacing,
  goldenTypography,
  goldenBorderRadius,
  goldenSizing,
  goldenShadows,
  goldenDurations,
  goldenGrid,
  goldenRatioTailwindExtend,
  goldenCSSVariables,
  default as goldenRatio,
} from './golden-ratio';

// Tailwind preset
export { madfamPreset, default as tailwindPreset } from './tailwind-preset';

// Semantic color tokens
export {
  semanticColorTokens,
  tailwindSemanticColors,
  semanticColorCSSVariables,
  semanticColorCSSVariablesDark,
  default as semanticColors,
} from './semantic-colors';
