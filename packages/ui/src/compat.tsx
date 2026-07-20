/**
 * React 19 Compatibility Layer for UI Components
 *
 * This file provides type-compatible exports of all UI components that work
 * with React 19. All components are cast to bypass JSX type errors (TS2786)
 * while maintaining runtime behavior.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- Reason: React 19 compatibility layer; all components cast to any to bypass TS2786 JSX type errors */

import * as UIComponents from './index';

// Re-export all components with type assertions for React 19 compatibility
export const Alert = UIComponents.Alert as any;
export const AlertDialog = UIComponents.AlertDialog as any;
export const AlertDialogAction = UIComponents.AlertDialogAction as any;
export const AlertDialogCancel = UIComponents.AlertDialogCancel as any;
export const AlertDialogContent = UIComponents.AlertDialogContent as any;
export const AlertDialogDescription = UIComponents.AlertDialogDescription as any;
export const AlertDialogFooter = UIComponents.AlertDialogFooter as any;
export const AlertDialogHeader = UIComponents.AlertDialogHeader as any;
export const AlertDialogTitle = UIComponents.AlertDialogTitle as any;
export const AlertDialogTrigger = UIComponents.AlertDialogTrigger as any;
export const AlertDescription = UIComponents.AlertDescription as any;
export const AlertTitle = UIComponents.AlertTitle as any;
export const Badge = UIComponents.Badge as any;
export const Button = UIComponents.Button as any;
export const Card = UIComponents.Card as any;
export const CardContent = UIComponents.CardContent as any;
export const CardDescription = UIComponents.CardDescription as any;
export const CardFooter = UIComponents.CardFooter as any;
export const CardHeader = UIComponents.CardHeader as any;
export const CardTitle = UIComponents.CardTitle as any;
export const Checkbox = UIComponents.Checkbox as any;
export const Dialog = UIComponents.Dialog as any;
export const DialogContent = UIComponents.DialogContent as any;
export const DialogDescription = UIComponents.DialogDescription as any;
export const DialogFooter = UIComponents.DialogFooter as any;
export const DialogHeader = UIComponents.DialogHeader as any;
export const DialogTitle = UIComponents.DialogTitle as any;
export const DialogTrigger = UIComponents.DialogTrigger as any;
export const DropdownMenu = UIComponents.DropdownMenu as any;
export const DropdownMenuCheckboxItem = UIComponents.DropdownMenuCheckboxItem as any;
export const DropdownMenuContent = UIComponents.DropdownMenuContent as any;
export const DropdownMenuGroup = UIComponents.DropdownMenuGroup as any;
export const DropdownMenuItem = UIComponents.DropdownMenuItem as any;
export const DropdownMenuLabel = UIComponents.DropdownMenuLabel as any;
export const DropdownMenuPortal = UIComponents.DropdownMenuPortal as any;
export const DropdownMenuRadioGroup = UIComponents.DropdownMenuRadioGroup as any;
export const DropdownMenuRadioItem = UIComponents.DropdownMenuRadioItem as any;
export const DropdownMenuSeparator = UIComponents.DropdownMenuSeparator as any;
export const DropdownMenuShortcut = UIComponents.DropdownMenuShortcut as any;
export const DropdownMenuSub = UIComponents.DropdownMenuSub as any;
export const DropdownMenuSubContent = UIComponents.DropdownMenuSubContent as any;
export const DropdownMenuSubTrigger = UIComponents.DropdownMenuSubTrigger as any;
export const DropdownMenuTrigger = UIComponents.DropdownMenuTrigger as any;
export const Input = UIComponents.Input as any;
export const Label = UIComponents.Label as any;
export const Popover = UIComponents.Popover as any;
export const PopoverContent = UIComponents.PopoverContent as any;
export const PopoverTrigger = UIComponents.PopoverTrigger as any;
export const Progress = UIComponents.Progress as any;
export const Select = UIComponents.Select as any;
export const SelectContent = UIComponents.SelectContent as any;
export const SelectGroup = UIComponents.SelectGroup as any;
export const SelectItem = UIComponents.SelectItem as any;
export const SelectLabel = UIComponents.SelectLabel as any;
export const SelectScrollDownButton = UIComponents.SelectScrollDownButton as any;
export const SelectScrollUpButton = UIComponents.SelectScrollUpButton as any;
export const SelectSeparator = UIComponents.SelectSeparator as any;
export const SelectTrigger = UIComponents.SelectTrigger as any;
export const SelectValue = UIComponents.SelectValue as any;
export const Separator = UIComponents.Separator as any;
export const Skeleton = UIComponents.Skeleton as any;
export const Switch = UIComponents.Switch as any;
export const Tabs = UIComponents.Tabs as any;
export const TabsContent = UIComponents.TabsContent as any;
export const TabsList = UIComponents.TabsList as any;
export const TabsTrigger = UIComponents.TabsTrigger as any;
export const Textarea = UIComponents.Textarea as any;
export const Toast = UIComponents.Toast as any;
export const ToastAction = UIComponents.ToastAction as any;
export const ToastClose = UIComponents.ToastClose as any;
export const ToastDescription = UIComponents.ToastDescription as any;
export const ToastProvider = UIComponents.ToastProvider as any;
export const ToastTitle = UIComponents.ToastTitle as any;
export const ToastViewport = UIComponents.ToastViewport as any;
export const Toaster = UIComponents.Toaster as any;

// Re-export hooks and utilities directly from their sources
export { useToast, toast } from './hooks/use-toast';
export type { ToasterToast } from './hooks/use-toast';
export { cn } from './lib/utils';
export { buttonVariants } from './components/button';
export type { ButtonProps } from './components/button';
export type { InputProps } from './components/input';
export type { TextareaProps } from './components/textarea';
export type { BadgeProps } from './components/badge';
export { badgeVariants } from './components/badge';

// Re-export Dialog sub-components
export { DialogPortal, DialogOverlay, DialogClose } from './components/dialog';

// Re-export AlertDialog sub-components
export { AlertDialogPortal, AlertDialogOverlay } from './components/alert-dialog';

// Direct exports for Slider and Tooltip (React 19 compatible)
export { Slider } from './components/slider';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/tooltip';
