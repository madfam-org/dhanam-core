'use client';

import { useTranslation } from '@dhanam-core/shared';
import { Button, Sheet, SheetContent, SheetTitle } from '@dhanam-core/ui';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DashboardNav } from './dashboard-nav';

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation('common');

  // Auto-close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-11 w-11"
        onClick={() => setOpen(true)}
        aria-label={t('aria.openSidebar')}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <SheetContent side="left" className="p-0 w-64">
        <SheetTitle className="sr-only">{t('aria.mainNavigation')}</SheetTitle>
        <DashboardNav />
      </SheetContent>
    </Sheet>
  );
}
