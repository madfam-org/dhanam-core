/* eslint-disable @typescript-eslint/no-explicit-any -- Reason: React 19 compatibility shim; Slider export cast to any for JSX type compatibility */
'use client';

import * as React from 'react';

export interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

const SliderBase = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    { value = [0], onValueChange, min = 0, max = 100, step = 1, className = '', disabled = false },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (onValueChange) {
        onValueChange([newValue]);
      }
    };

    return (
      <div ref={ref} className={className}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          disabled={disabled}
          className="w-full"
        />
      </div>
    );
  }
);

SliderBase.displayName = 'Slider';

// React 19 compatible export
export const Slider = SliderBase as any;
