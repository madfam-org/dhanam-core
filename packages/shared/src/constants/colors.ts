/**
 * Reusable color palettes for charts, tags, and celebrations.
 * Use these instead of inline hex values in components.
 */

export const CHART_COLORS = [
  '#F1C40F',
  '#E67E22',
  '#9B59B6',
  '#3498DB',
  '#2980B9',
  '#1ABC9C',
  '#8E44AD',
  '#34495E',
  '#2C3E50',
  '#E74C3C',
  '#C0392B',
  '#2ECC71',
  '#27AE60',
  '#D35400',
  '#16A085',
  '#7F8C8D',
] as const;

export const TAG_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#64748b',
] as const;

export const CELEBRATION_COLORS = {
  goal: ['#FFD700', '#FFA500', '#FF6347'] as const,
  streak: ['#10B981', '#34D399', '#6EE7B7', '#FFD700'] as const,
} as const;

export const FALLBACK_COLORS = {
  category: '#6b7280',
  tag: '#64748b',
  chart: '#6366f1',
} as const;
