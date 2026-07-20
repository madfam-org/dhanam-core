/**
 * Lucide React Icon Compatibility Wrapper
 *
 * This module provides React 19-compatible type assertions for lucide-react icons.
 * It resolves TypeScript errors where icons cannot be used as JSX components due
 * to type mismatches between lucide-react's type definitions and React 19's stricter
 * component typing.
 */

import * as LucideIcons from 'lucide-react';
import type React from 'react';

// Type assertion helper for lucide-react icons to work with React 19
type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

// Re-export commonly used icons with proper type assertions
export const Check = LucideIcons.Check as unknown as IconComponent;
export const X = LucideIcons.X as unknown as IconComponent;
export const ChevronRight = LucideIcons.ChevronRight as unknown as IconComponent;
export const ChevronDown = LucideIcons.ChevronDown as unknown as IconComponent;
export const ChevronUp = LucideIcons.ChevronUp as unknown as IconComponent;
export const Circle = LucideIcons.Circle as unknown as IconComponent;
