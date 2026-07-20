/**
 * DHANAM Semantic Color Tokens
 *
 * This module defines semantic color tokens that provide consistent meaning
 * across the design system. Use these tokens instead of hardcoded color values.
 *
 * Web Usage (Tailwind CSS):
 * - text-success, bg-success, text-success/10
 * - text-destructive, bg-destructive, text-destructive/10
 * - text-warning, bg-warning, text-warning/10
 * - text-info, bg-info, text-info/10
 * - text-goal-excellent, text-goal-on-track, text-goal-attention, text-goal-at-risk
 *
 * Mobile Usage (React Native):
 * import { colors, getTransactionColor, getGoalHealthColor } from '@/tokens/colors';
 */

/**
 * Semantic status colors (HSL values for CSS variables)
 */
export const semanticColorTokens = {
  light: {
    // Status colors
    success: '142.1 76.2% 36.3%',
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',
    warningForeground: '0 0% 0%',
    info: '217.2 91.2% 59.8%',
    infoForeground: '0 0% 100%',

    // Background variants (for use with opacity)
    successBg: '142.1 76.2% 96%',
    warningBg: '38 92% 95%',
    infoBg: '217.2 91.2% 96%',
    destructiveBg: '0 84.2% 97%',

    // Financial context
    income: '142.1 76.2% 36.3%',
    expense: '0 84.2% 60.2%',
    transfer: '217.2 91.2% 59.8%',

    // Goal health indicators
    goalExcellent: '142.1 76.2% 36.3%',
    goalOnTrack: '217.2 91.2% 59.8%',
    goalAttention: '38 92% 50%',
    goalAtRisk: '0 84.2% 60.2%',
  },
  dark: {
    // Status colors (lighter for dark mode)
    success: '142.1 70.6% 45.3%',
    successForeground: '0 0% 100%',
    warning: '38 92% 60%',
    warningForeground: '0 0% 0%',
    info: '217.2 91.2% 65%',
    infoForeground: '0 0% 100%',

    // Background variants (darker for dark mode)
    successBg: '142.1 70.6% 15%',
    warningBg: '38 92% 15%',
    infoBg: '217.2 91.2% 15%',
    destructiveBg: '0 62.8% 15%',

    // Financial context (adjusted for dark mode)
    income: '142.1 70.6% 45.3%',
    expense: '0 62.8% 50%',
    transfer: '217.2 91.2% 65%',

    // Goal health indicators (adjusted for dark mode)
    goalExcellent: '142.1 70.6% 45.3%',
    goalOnTrack: '217.2 91.2% 65%',
    goalAttention: '38 92% 60%',
    goalAtRisk: '0 62.8% 50%',
  },
} as const;

/**
 * Semantic color mappings for Tailwind configuration
 */
export const tailwindSemanticColors = {
  success: {
    DEFAULT: 'hsl(var(--success))',
    foreground: 'hsl(var(--success-foreground))',
  },
  warning: {
    DEFAULT: 'hsl(var(--warning))',
    foreground: 'hsl(var(--warning-foreground))',
  },
  info: {
    DEFAULT: 'hsl(var(--info))',
    foreground: 'hsl(var(--info-foreground))',
  },
  income: 'hsl(var(--income))',
  expense: 'hsl(var(--expense))',
  transfer: 'hsl(var(--transfer))',
  'goal-excellent': 'hsl(var(--goal-excellent))',
  'goal-on-track': 'hsl(var(--goal-on-track))',
  'goal-attention': 'hsl(var(--goal-attention))',
  'goal-at-risk': 'hsl(var(--goal-at-risk))',
} as const;

/**
 * CSS variable definitions for semantic colors
 */
export const semanticColorCSSVariables = `
/* Semantic Status Colors */
--success: ${semanticColorTokens.light.success};
--success-foreground: ${semanticColorTokens.light.successForeground};
--warning: ${semanticColorTokens.light.warning};
--warning-foreground: ${semanticColorTokens.light.warningForeground};
--info: ${semanticColorTokens.light.info};
--info-foreground: ${semanticColorTokens.light.infoForeground};

/* Extended Status Colors (for backgrounds with opacity) */
--success-bg: ${semanticColorTokens.light.successBg};
--warning-bg: ${semanticColorTokens.light.warningBg};
--info-bg: ${semanticColorTokens.light.infoBg};
--destructive-bg: ${semanticColorTokens.light.destructiveBg};

/* Financial Context Colors */
--income: ${semanticColorTokens.light.income};
--expense: ${semanticColorTokens.light.expense};
--transfer: ${semanticColorTokens.light.transfer};

/* Goal Health Colors */
--goal-excellent: ${semanticColorTokens.light.goalExcellent};
--goal-on-track: ${semanticColorTokens.light.goalOnTrack};
--goal-attention: ${semanticColorTokens.light.goalAttention};
--goal-at-risk: ${semanticColorTokens.light.goalAtRisk};
`;

export const semanticColorCSSVariablesDark = `
/* Semantic Status Colors (Dark Mode) */
--success: ${semanticColorTokens.dark.success};
--success-foreground: ${semanticColorTokens.dark.successForeground};
--warning: ${semanticColorTokens.dark.warning};
--warning-foreground: ${semanticColorTokens.dark.warningForeground};
--info: ${semanticColorTokens.dark.info};
--info-foreground: ${semanticColorTokens.dark.infoForeground};

/* Extended Status Colors (Dark Mode) */
--success-bg: ${semanticColorTokens.dark.successBg};
--warning-bg: ${semanticColorTokens.dark.warningBg};
--info-bg: ${semanticColorTokens.dark.infoBg};
--destructive-bg: ${semanticColorTokens.dark.destructiveBg};

/* Financial Context Colors (Dark Mode) */
--income: ${semanticColorTokens.dark.income};
--expense: ${semanticColorTokens.dark.expense};
--transfer: ${semanticColorTokens.dark.transfer};

/* Goal Health Colors (Dark Mode) */
--goal-excellent: ${semanticColorTokens.dark.goalExcellent};
--goal-on-track: ${semanticColorTokens.dark.goalOnTrack};
--goal-attention: ${semanticColorTokens.dark.goalAttention};
--goal-at-risk: ${semanticColorTokens.dark.goalAtRisk};
`;

export default {
  tokens: semanticColorTokens,
  tailwind: tailwindSemanticColors,
  cssVariables: semanticColorCSSVariables,
  cssVariablesDark: semanticColorCSSVariablesDark,
};
