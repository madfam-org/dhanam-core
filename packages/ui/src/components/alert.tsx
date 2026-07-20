import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

/**
 * Alert variant styles
 *
 * ## Variants
 * - `default`: Neutral information alert
 * - `destructive`: Error or danger alert (red)
 * - `warning`: Warning alert (yellow)
 */
const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        warning: 'border-warning/50 bg-warning/10 text-warning-foreground [&>svg]:text-warning',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Alert component for important messages
 *
 * Accessible alert with ARIA role="alert" for screen readers.
 * Supports icons positioned absolutely within the container.
 *
 * @example
 * ```tsx
 * // Success/Info alert
 * <Alert>
 *   <InfoIcon className="h-4 w-4" />
 *   <AlertTitle>Transaction synced</AlertTitle>
 *   <AlertDescription>
 *     Your accounts have been updated with 15 new transactions.
 *   </AlertDescription>
 * </Alert>
 *
 * // Error alert
 * <Alert variant="destructive">
 *   <AlertCircleIcon className="h-4 w-4" />
 *   <AlertTitle>Sync failed</AlertTitle>
 *   <AlertDescription>
 *     Unable to connect to your bank. Please try again.
 *   </AlertDescription>
 * </Alert>
 * ```
 */
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  )
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
