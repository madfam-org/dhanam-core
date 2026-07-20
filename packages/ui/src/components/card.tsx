import * as React from 'react';

import { cn } from '../lib/utils';

/**
 * Card container component
 *
 * A flexible container for grouping related content with consistent
 * styling. Use with CardHeader, CardContent, and CardFooter for
 * structured layouts.
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Account Balance</CardTitle>
 *     <CardDescription>Your current balance across all accounts</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p className="text-2xl font-bold">$12,345.67</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>View Details</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

/**
 * Card header section
 *
 * Contains CardTitle and CardDescription for card heading area.
 */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

/**
 * Card title component
 *
 * Renders as h3 with consistent typography.
 */
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

/**
 * Card description component
 *
 * Muted text for card subtitle or description.
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

/**
 * Card main content area
 *
 * Primary content section with appropriate padding.
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

/**
 * Card footer section
 *
 * Bottom section typically used for actions/buttons.
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
