'use client';

import { Skeleton } from '@dhanam-core/ui';

export function CalendarSkeleton() {
  return (
    <div className="space-y-2">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-8 rounded" />
        ))}
      </div>
      {/* Day cells — 5 rows of 7 */}
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={`row-${row}`} className="grid grid-cols-7 gap-px">
          {Array.from({ length: 7 }).map((_, col) => (
            <Skeleton
              key={`cell-${row}-${col}`}
              className="h-[80px] md:h-[80px] h-[48px] rounded"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
