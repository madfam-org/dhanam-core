'use client';

import { useEffect, useRef } from 'react';

// Global error renders outside all providers, so CSS custom properties and
// theme classes are unavailable. Raw Tailwind color classes are intentional.
const defaultMsg = {
  title: 'Dhanam',
  body: 'Something went wrong. Please try refreshing the page.',
  button: 'Try Again',
};

const messages: Record<string, typeof defaultMsg> = {
  en: defaultMsg,
  es: {
    title: 'Dhanam',
    body: 'Algo salio mal. Por favor intenta recargar la pagina.',
    button: 'Reintentar',
  },
  pt: {
    title: 'Dhanam',
    body: 'Algo deu errado. Por favor, tente atualizar a pagina.',
    button: 'Tentar novamente',
  },
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lang =
    typeof navigator !== 'undefined' ? (navigator.language?.split('-')[0] ?? 'en') : 'en';
  const m = messages[lang] ?? defaultMsg;

  useEffect(() => {
    import('@sentry/nextjs').then((Sentry) => Sentry.captureException(error)).catch(() => {});
    buttonRef.current?.focus();
  }, [error]);

  return (
    <html lang={lang}>
      <body className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 px-4 py-8 sm:p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold mb-2">{m.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{m.body}</p>
          <button
            ref={buttonRef}
            onClick={reset}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {m.button}
          </button>
          {error?.digest && (
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-4">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
