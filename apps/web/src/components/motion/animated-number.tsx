'use client';

import { useInView, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (n: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 0.8,
  formatFn = (n) => n.toLocaleString(),
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(formatFn(0));

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setDisplayed(formatFn(latest));
      },
    });

    return () => controls.stop();
  }, [isInView, value, duration, formatFn]);

  return (
    <span ref={ref} className={className}>
      {displayed}
    </span>
  );
}
