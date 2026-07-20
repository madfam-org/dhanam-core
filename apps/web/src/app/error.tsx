'use client';

import Link from 'next/link';
import { useEffect } from 'react';

const defaultMsg = {
  title: 'Something went wrong',
  body: 'An unexpected error occurred. Please try again.',
  retry: 'Try Again',
  home: 'Go Home',
};

const messages: Record<string, typeof defaultMsg> = {
  en: defaultMsg,
  es: {
    title: 'Algo salio mal',
    body: 'Ocurrio un error inesperado. Intenta de nuevo.',
    retry: 'Reintentar',
    home: 'Ir al inicio',
  },
  pt: {
    title: 'Algo deu errado',
    body: 'Ocorreu um erro inesperado. Tente novamente.',
    retry: 'Tentar novamente',
    home: 'Ir para o inicio',
  },
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const lang =
    typeof navigator !== 'undefined' ? (navigator.language?.split('-')[0] ?? 'en') : 'en';
  const m = messages[lang] ?? defaultMsg;

  useEffect(() => {
    import('@sentry/nextjs').then((Sentry) => Sentry.captureException(error)).catch(() => {});
    console.error('[RouteError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6">
      <div className="mx-auto max-w-md text-center">
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-lg bg-destructive/10">
          <span className="text-lg font-bold text-destructive" aria-hidden="true">
            !
          </span>
        </div>
        <h2 className="mt-4 text-lg font-semibold">{m.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message || m.body}</p>
        {error?.digest && (
          <p className="mt-2 text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {m.retry}
          </button>
          <Link
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {m.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
