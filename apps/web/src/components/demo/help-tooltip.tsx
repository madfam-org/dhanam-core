'use client';

import { useTranslation } from '@dhanam-core/shared';
import { Info } from 'lucide-react';
import { useState } from 'react';

interface HelpTooltipProps {
  content: string;
  title?: string;
}

export function HelpTooltip({ content, title }: HelpTooltipProps) {
  const { t } = useTranslation('common');
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.preventDefault();
          setIsVisible(!isVisible);
        }}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label={t('aria.help')}
      >
        <Info className="h-4 w-4" />
      </button>

      {isVisible && (
        <div className="absolute z-50 w-64 p-3 bg-popover text-popover-foreground rounded-lg shadow-lg border left-1/2 -translate-x-1/2 bottom-full mb-2">
          {title && <p className="font-semibold text-sm mb-1">{title}</p>}
          <p className="text-xs leading-relaxed">{content}</p>
          <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-px">
            <div className="border-8 border-transparent border-t-popover" />
          </div>
        </div>
      )}
    </div>
  );
}
