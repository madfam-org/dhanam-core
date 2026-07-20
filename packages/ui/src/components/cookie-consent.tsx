'use client';

import { useState, useEffect } from 'react';

const CONSENT_COOKIE = 'dhanam_consent';

type ConsentStatus = 'accepted' | 'rejected' | null;

function getConsentStatus(): ConsentStatus {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  if (!match) return null;
  return match[1] as ConsentStatus;
}

function setConsentCookie(status: 'accepted' | 'rejected') {
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `${CONSENT_COOKIE}=${status}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
}

export function CookieConsent({
  onAccept,
  onReject,
  message,
  acceptLabel,
  rejectLabel,
}: {
  onAccept?: () => void;
  onReject?: () => void;
  message?: string;
  acceptLabel?: string;
  rejectLabel?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const status = getConsentStatus();
    if (!status) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    setConsentCookie('accepted');
    setVisible(false);
    onAccept?.();
  };

  const handleReject = () => {
    setConsentCookie('rejected');
    setVisible(false);
    onReject?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row">
        <p className="flex-1 text-sm text-muted-foreground">
          {message ??
            'We use cookies and analytics to improve your experience. You can accept or reject non-essential cookies.'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {rejectLabel ?? 'Reject'}
          </button>
          <button
            onClick={handleAccept}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {acceptLabel ?? 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { getConsentStatus, CONSENT_COOKIE };
