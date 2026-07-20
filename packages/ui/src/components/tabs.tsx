import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../lib/utils';

/**
 * Tabs component for content organization
 *
 * Accessible tab interface built on Radix UI primitives.
 * Supports keyboard navigation (arrow keys), screen readers, and custom styling.
 *
 * ## Components
 * - `Tabs`: Root context provider
 * - `TabsList`: Container for tab triggers
 * - `TabsTrigger`: Individual tab button
 * - `TabsContent`: Content panel for each tab
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="overview">
 *   <TabsList>
 *     <TabsTrigger value="overview">Overview</TabsTrigger>
 *     <TabsTrigger value="transactions">Transactions</TabsTrigger>
 *     <TabsTrigger value="analytics">Analytics</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="overview">
 *     <Card>Account summary content...</Card>
 *   </TabsContent>
 *   <TabsContent value="transactions">
 *     <TransactionList />
 *   </TabsContent>
 *   <TabsContent value="analytics">
 *     <AnalyticsCharts />
 *   </TabsContent>
 * </Tabs>
 * ```
 */
const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
