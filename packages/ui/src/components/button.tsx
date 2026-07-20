import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

/**
 * Button variant styles using class-variance-authority
 *
 * ## Variants
 * - `default`: Primary action button (filled background)
 * - `destructive`: Dangerous actions like delete (red)
 * - `outline`: Secondary action (bordered)
 * - `secondary`: Alternative secondary style
 * - `ghost`: Minimal, no background
 * - `link`: Text-only link style
 *
 * ## Sizes
 * - `default`: Standard height (h-10)
 * - `sm`: Small (h-9)
 * - `lg`: Large (h-11)
 * - `icon`: Square icon button (h-10 w-10)
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Button component props
 * @extends React.ButtonHTMLAttributes<HTMLButtonElement>
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render as child component (e.g., for Link wrapper) */
  asChild?: boolean;
}

/**
 * Primary button component for user actions
 *
 * Built with shadcn/ui and Radix UI primitives. Supports multiple
 * variants, sizes, and can render as different elements via `asChild`.
 *
 * @example
 * ```tsx
 * // Primary action
 * <Button variant="default">Save Changes</Button>
 *
 * // Destructive action
 * <Button variant="destructive">Delete Account</Button>
 *
 * // As a link
 * <Button asChild variant="link">
 *   <Link href="/settings">Settings</Link>
 * </Button>
 *
 * // Icon button
 * <Button variant="ghost" size="icon">
 *   <PlusIcon />
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
