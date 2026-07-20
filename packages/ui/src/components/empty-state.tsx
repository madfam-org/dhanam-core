import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

import { cn } from '../lib/utils';
import { Button } from './button';
import { Card, CardContent } from './card';

/**
 * Action configuration for empty state
 */
interface EmptyStateAction {
  /** Button label text */
  label: string;
  /** Link href (renders as anchor) */
  href?: string;
  /** Click handler (renders as button) */
  onClick?: () => void;
  /** Optional icon to show in button */
  icon?: LucideIcon;
}

/**
 * EmptyState component props
 */
export interface EmptyStateProps {
  /** Lucide icon to display */
  icon: LucideIcon;
  /** Main heading text */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Optional call-to-action button */
  action?: EmptyStateAction;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty state placeholder component
 *
 * Displays a centered card with icon, message, and optional action
 * when there's no data to show. Common for empty lists, first-run
 * experiences, and error states.
 *
 * @example
 * ```tsx
 * // No transactions yet
 * <EmptyState
 *   icon={WalletIcon}
 *   title="No transactions"
 *   description="Connect your bank account to see your transactions here."
 *   action={{
 *     label: "Connect Account",
 *     href: "/accounts/connect",
 *     icon: PlusIcon
 *   }}
 * />
 *
 * // No search results
 * <EmptyState
 *   icon={SearchIcon}
 *   title="No results found"
 *   description="Try adjusting your search terms or filters."
 * />
 *
 * // First budget
 * <EmptyState
 *   icon={PiggyBankIcon}
 *   title="Create your first budget"
 *   description="Set spending limits for different categories."
 *   action={{
 *     label: "Create Budget",
 *     onClick: () => setShowBudgetDialog(true)
 *   }}
 * />
 * ```
 */
function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  const DisplayIcon = Icon as ComponentType<{ className?: string }>;
  const ActionIcon = action?.icon as ComponentType<{ className?: string }> | undefined;

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <DisplayIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
        )}
        {action &&
          (action.href ? (
            <Button asChild>
              <a href={action.href}>
                {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                {action.label}
              </a>
            </Button>
          ) : (
            <Button onClick={action.onClick}>
              {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          ))}
      </CardContent>
    </Card>
  );
}

export { EmptyState };
