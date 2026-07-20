/* eslint-disable @typescript-eslint/no-explicit-any -- Reason: React 19 compatibility shim; exports cast to any for JSX type compatibility */
'use client';

import * as React from 'react';

export interface TooltipProps {
  children: React.ReactNode;
}

export interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
}

const TooltipProviderBase: React.FC<TooltipProps> = ({ children }) => {
  return <>{children}</>;
};

const TooltipBase: React.FC<TooltipProps> = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

const TooltipTriggerBase: React.FC<TooltipTriggerProps> = ({ children, asChild }) => {
  if (asChild && React.isValidElement(children)) {
    return children;
  }
  return <div className="inline-block">{children}</div>;
};

const TooltipContentBase: React.FC<TooltipContentProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`absolute z-50 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md shadow-md ${className}`}
    >
      {children}
    </div>
  );
};

// React 19 compatible exports
export const TooltipProvider = TooltipProviderBase as any;
export const Tooltip = TooltipBase as any;
export const TooltipTrigger = TooltipTriggerBase as any;
export const TooltipContent = TooltipContentBase as any;
