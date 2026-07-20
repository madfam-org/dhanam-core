import * as React from 'react';

import { cn } from '../lib/utils';

/**
 * Input component props
 * @extends React.InputHTMLAttributes<HTMLInputElement>
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Text input component
 *
 * Standard form input with consistent styling and focus states.
 * Supports all native input types (text, email, password, number, etc.).
 *
 * @example
 * ```tsx
 * // Basic text input
 * <Input placeholder="Enter your name" />
 *
 * // Currency input
 * <Input type="number" step="0.01" placeholder="0.00" />
 *
 * // With label
 * <div>
 *   <Label htmlFor="email">Email</Label>
 *   <Input id="email" type="email" placeholder="user@example.com" />
 * </div>
 *
 * // Disabled state
 * <Input disabled value="Read only" />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
