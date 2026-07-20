'use client';

import { useTranslation } from '@dhanam-core/shared';
import { Button } from '@dhanam-core/ui';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation('common');

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-11 w-11"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={t('aria.toggleTheme')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
