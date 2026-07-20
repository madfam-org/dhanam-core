// React 19 compatibility fix for Radix UI and other libraries
// This addresses React 19 type incompatibilities with older component libraries

import 'react';

declare module 'react' {
  // Keep ElementType broad enough for Lucide icons and other component libraries.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reason: React 19 type compatibility fix for Radix UI and other libraries requires generic any
  type ElementType<P = any> = keyof JSX.IntrinsicElements | ComponentType<P>;

  // Fix bigint in ReactNode
  namespace JSX {
    interface IntrinsicAttributes {
      key?: Key | null | undefined;
    }
  }
}
