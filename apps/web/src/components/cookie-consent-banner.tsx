'use client';

import { useTranslation } from '@dhanam-core/shared';
import { Button } from '@dhanam-core/ui';
import { useEffect, useState } from 'react';

import { optInPostHog, optOutPostHog } from '~/lib/posthog';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? match[1] : undefined;
}

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation('common');

  useEffect(() => {
    const consent = getCookie('dhanam_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setCookie('dhanam_consent', 'accepted', 365);
    optInPostHog();
    setVisible(false);
  };

  const handleReject = () => {
    setCookie('dhanam_consent', 'rejected', 365);
    optOutPostHog();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t bg-background p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row">
        <p className="flex-1 text-sm text-muted-foreground">
          {t('cookieConsent.message')}{' '}
          <a href="/cookies" className="underline hover:text-foreground">
            {t('cookieConsent.learnMore')}
          </a>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReject}>
            {t('cookieConsent.reject')}
          </Button>
          <Button size="sm" onClick={handleAccept}>
            {t('cookieConsent.accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
