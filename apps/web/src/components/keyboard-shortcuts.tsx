'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@dhanam-core/ui';
import { useState, useEffect, useRef } from 'react';

import { useDemoRouter } from '~/lib/hooks/use-demo-router';

interface ShortcutItem {
  keys: string[];
  label: string;
}

interface ShortcutSection {
  title: string;
  items: ShortcutItem[];
}

const shortcutSections: ShortcutSection[] = [
  {
    title: 'Navigation',
    items: [
      { keys: ['G', 'D'], label: 'Go to Dashboard' },
      { keys: ['G', 'T'], label: 'Go to Transactions' },
      { keys: ['G', 'A'], label: 'Go to Accounts' },
      { keys: ['G', 'B'], label: 'Go to Budgets' },
      { keys: ['G', 'S'], label: 'Go to Settings' },
      { keys: ['G', 'G'], label: 'Go to Goals' },
    ],
  },
  {
    title: 'Actions',
    items: [
      { keys: ['N'], label: 'New Transaction' },
      { keys: ['⌘', 'K'], label: 'Search' },
      { keys: ['?'], label: 'This help' },
    ],
  },
];

const NAV_MAP: Record<string, string> = {
  d: '/dashboard',
  t: '/transactions',
  b: '/budgets',
  a: '/analytics',
  s: '/settings',
  g: '/goals',
};

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const router = useDemoRouter();
  const pendingG = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      // ? → show help
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      // G then letter navigation
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !pendingG.current) {
        pendingG.current = true;
        gTimer.current = setTimeout(() => {
          pendingG.current = false;
        }, 500);
        return;
      }

      if (pendingG.current) {
        pendingG.current = false;
        clearTimeout(gTimer.current);
        const dest = NAV_MAP[e.key];
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {shortcutSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.items.map((s) => (
                  <div key={s.label} className="grid grid-cols-2 items-center gap-4">
                    <div className="flex gap-1 justify-end">
                      {s.keys.map((k, i) => (
                        <kbd
                          key={`${k}-${i}`}
                          className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press <kbd className="rounded border px-1 text-[10px]">?</kbd> to toggle this dialog
        </p>
      </DialogContent>
    </Dialog>
  );
}
