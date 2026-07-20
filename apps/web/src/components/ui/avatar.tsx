/* eslint-disable @typescript-eslint/no-explicit-any -- Reason: React 19 compatibility; Radix Avatar components cast to any for JSX type compatibility */
'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as React from 'react';

import { cn } from '@/lib/utils';

const AvatarBase = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
AvatarBase.displayName = AvatarPrimitive.Root.displayName;

const AvatarImageBase = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImageBase.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallbackBase = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
));
AvatarFallbackBase.displayName = AvatarPrimitive.Fallback.displayName;

// React 19 compatible exports
export const Avatar = AvatarBase as any;
export const AvatarImage = AvatarImageBase as any;
export const AvatarFallback = AvatarFallbackBase as any;
