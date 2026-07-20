/**
 * MADFAM Golden Ratio Tailwind Preset
 *
 * A Tailwind CSS preset that extends the default theme with golden ratio tokens.
 *
 * Usage in tailwind.config.ts:
 * ```ts
 * import { madfamPreset } from '@dhanam-core/ui/tokens';
 *
 * export default {
 *   presets: [madfamPreset],
 *   // ... rest of config
 * };
 * ```
 */

import type { Config } from 'tailwindcss';
import {
  goldenSpacing,
  goldenTypography,
  goldenBorderRadius,
  goldenShadows,
  goldenDurations,
  goldenSizing,
} from './golden-ratio';

/**
 * MADFAM Color Palette
 *
 * Consumers can override these with their own aesthetic,
 * but these are the shared foundation colors.
 */
const madfamColors = {
  // Solarpunk-inspired greens (primary across ecosystem)
  solarpunk: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // Golden amber (accent, representing the golden ratio)
  golden: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Deep earth tones (grounding, stability)
  earth: {
    50: '#faf5f0',
    100: '#f0e6d8',
    200: '#e0ccb0',
    300: '#cba876',
    400: '#b5854a',
    500: '#9a6b32',
    600: '#7d5427',
    700: '#5f3f1e',
    800: '#422b15',
    900: '#2a1b0e',
    950: '#1a1009',
  },
};

/**
 * The MADFAM Tailwind Preset
 */
export const madfamPreset: Partial<Config> = {
  theme: {
    extend: {
      // Golden ratio spacing
      spacing: {
        ...goldenSpacing,
      },

      // Golden ratio typography
      fontSize: goldenTypography as any,

      // Golden ratio border radius
      borderRadius: {
        ...goldenBorderRadius,
      },

      // Golden ratio shadows
      boxShadow: {
        ...goldenShadows,
        // Glass morphism shadows
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-lg': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      },

      // Golden ratio animation durations
      transitionDuration: {
        ...goldenDurations,
      },

      // Golden ratio sizing
      width: {
        ...goldenSizing,
      },

      // Max widths for containers
      maxWidth: {
        'phi-sm': goldenSizing['phi-container-sm'],
        phi: goldenSizing['phi-container'],
        'phi-lg': goldenSizing['phi-container-lg'],
      },

      // MADFAM colors
      colors: {
        ...madfamColors,
      },

      // Golden ratio aspect ratios
      aspectRatio: {
        golden: '1.618 / 1',
        'golden-portrait': '1 / 1.618',
      },

      // Glass morphism backgrounds
      backdropBlur: {
        glass: '16px',
        'glass-lg': '24px',
      },

      // Animation keyframes
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },

      // Animation utilities
      animation: {
        'fade-in': `fade-in ${goldenDurations['phi-normal']} ease-out`,
        'fade-out': `fade-out ${goldenDurations['phi-normal']} ease-out`,
        'slide-in-up': `slide-in-up ${goldenDurations['phi-normal']} ease-out`,
        'slide-in-down': `slide-in-down ${goldenDurations['phi-normal']} ease-out`,
        'scale-in': `scale-in ${goldenDurations['phi-normal']} ease-out`,
        'spin-slow': `spin-slow ${goldenDurations['phi-slower']} linear infinite`,
      },
    },
  },
};

// Named export for direct import
export default madfamPreset;
