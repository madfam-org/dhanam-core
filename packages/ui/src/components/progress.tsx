import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '../lib/utils';

/**
 * Progress component props
 */
interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Custom class for the progress indicator bar */
  indicatorClassName?: string;
}

/**
 * Progress bar component
 *
 * Accessible progress indicator built on Radix UI primitives.
 * Use for loading states, upload progress, or goal completion visualization.
 *
 * @example
 * ```tsx
 * // Basic progress bar
 * <Progress value={33} />
 *
 * // Budget progress (with color based on status)
 * <Progress
 *   value={budget.spent / budget.limit * 100}
 *   indicatorClassName={
 *     spent > limit ? 'bg-destructive' :
 *     spent > limit * 0.9 ? 'bg-warning' :
 *     'bg-primary'
 *   }
 * />
 *
 * // Goal completion
 * <Progress value={goal.currentAmount / goal.targetAmount * 100} />
 * ```
 */
const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  (
    {
      className,
      value,
      indicatorClassName,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      ...props
    },
    ref
  ) => (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}
      aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? 'Progress')}
      aria-labelledby={ariaLabelledBy}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full w-full flex-1 bg-primary transition-all', indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress, type ProgressProps };
