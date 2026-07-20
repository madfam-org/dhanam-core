import * as React from 'react';

import { cn } from '../lib/utils';

export type BasketweaveVariant = 'default' | 'landing';

export interface BasketweaveSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional subtle background drift (honors prefers-reduced-motion). */
  drift?: boolean;
  /** Preset token overrides — `landing` uses Regenerative Ledger teal/copper. */
  variant?: BasketweaveVariant;
}

const variantClass: Record<BasketweaveVariant, string> = {
  default: '',
  landing: 'landing-basketweave',
};

/**
 * Full-bleed Art Deco basketweave background layer.
 * Place behind page content (`absolute inset-0 -z-10` or equivalent).
 */
export function BasketweaveSurface({
  className,
  drift = false,
  variant = 'default',
  ...props
}: BasketweaveSurfaceProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'dhanam-basketweave-surface',
        variantClass[variant],
        drift && 'dhanam-basketweave-surface--subtle-drift',
        className
      )}
      {...props}
    >
      <div className="dhanam-basketweave-lattice" />
    </div>
  );
}
