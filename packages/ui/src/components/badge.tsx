import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

/**
 * Badge variant styles
 *
 * ## Variants
 * - `default`: Primary colored badge
 * - `secondary`: Muted colored badge
 * - `destructive`: Red/danger badge
 * - `outline`: Bordered badge without fill
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Badge component props
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

/**
 * Badge component for status and labels
 *
 * Small pill-shaped label for categorization, status, or counts.
 * Commonly used for transaction categories, account status, ESG scores.
 *
 * @example
 * ```tsx
 * // Category badge
 * <Badge>Groceries</Badge>
 *
 * // Status badge
 * <Badge variant="secondary">Pending</Badge>
 *
 * // ESG score badge
 * <Badge variant={score >= 7 ? 'default' : 'destructive'}>
 *   ESG: {score}/10
 * </Badge>
 *
 * // Account type
 * <Badge variant="outline">Checking</Badge>
 * ```
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
