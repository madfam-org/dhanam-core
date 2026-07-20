'use client';

import { useTranslation } from '@dhanam-core/shared';
import type { Space } from '@dhanam-core/shared';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@dhanam-core/ui';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { MobileSidebar } from '~/components/layout/mobile-sidebar';
import { NotificationDropdown } from '~/components/layout/notification-dropdown';
import { LocaleSwitcher } from '~/components/locale-switcher/LocaleSwitcher';
import { SearchCommand } from '~/components/search/search-command';
import { ThemeToggle } from '~/components/theme-toggle';
import { useAuth } from '~/lib/hooks/use-auth';
import { useSpaces } from '~/lib/hooks/use-spaces';
import { useSpaceStore } from '~/stores/space';

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const spacesQuery = useSpaces();
  const spaces = spacesQuery.data as Space[] | undefined;
  const spacesLoading = spacesQuery.isLoading;
  const isPlaceholderData = spacesQuery.isPlaceholderData;
  const { currentSpace, setCurrentSpace } = useSpaceStore();
  const router = useRouter();
  const { t } = useTranslation('dashboard');

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <MobileSidebar />
          <span className="text-2xl font-bold shrink-0">Dhanam</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="min-w-0 sm:min-w-[200px] justify-between"
                disabled={spacesLoading && !spaces?.length}
              >
                {spacesLoading && !spaces?.length ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('header.loading')}
                  </span>
                ) : (
                  <>
                    <span className="truncate">
                      {currentSpace?.name || t('header.selectSpace')}
                    </span>
                    {isPlaceholderData && (
                      <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              <DropdownMenuLabel>{t('header.yourSpaces')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {spaces && spaces.length > 0 ? (
                <>
                  {spaces.map((space) => (
                    <DropdownMenuItem key={space.id} onClick={() => setCurrentSpace(space)}>
                      <div className="flex items-center justify-between w-full">
                        <span>{space.name}</span>
                        <span className="text-xs text-muted-foreground">{space.type}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard/spaces/new')}>
                    {t('header.createNewSpace')}
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => router.push('/dashboard/spaces/new')}>
                  {t('header.createFirstSpace')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          {currentSpace && (
            <div className="hidden sm:block">
              <SearchCommand spaceId={currentSpace.id} />
            </div>
          )}

          <LocaleSwitcher />
          <ThemeToggle />

          <NotificationDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <span className="hidden sm:inline">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                {t('header.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('header.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
