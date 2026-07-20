import type { Locale } from '@dhanam-core/shared';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Toaster } from 'sonner';

import { Providers } from '~/lib/providers';
import '~/styles/globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Dhanam - Budget & Wealth Tracker',
  description:
    'Personal-finance budgeting, tracking of finances and assets, and wealth planning.',
  metadataBase: new URL('http://localhost:3000'),
  alternates: {
    canonical: 'http://localhost:3000',
    languages: {
      es: 'http://localhost:3000/es',
      en: 'http://localhost:3000/en',
      'pt-BR': 'http://localhost:3000/pt-BR',
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Dhanam',
    title: 'Dhanam - Budget & Wealth Tracker',
    description:
      'Personal-finance budgeting, tracking and wealth planning.',
    url: 'http://localhost:3000',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Dhanam - Budget & Wealth Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dhanam - Budget & Wealth Tracker',
    description:
      'Personal-finance budgeting, tracking and wealth planning.',
    images: ['/opengraph-image'],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('dhanam_locale')?.value || 'es') as Locale;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Dhanam',
    url: 'http://localhost:3000',
    logo: 'http://localhost:3000/logo.png',
    description:
      'Personal-finance budgeting, tracking and wealth planning.',
    sameAs: ['https://github.com/madfam-org/dhanam-core'],
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="alternate" hrefLang="es" href="http://localhost:3000/es" />
        <link rel="alternate" hrefLang="en" href="http://localhost:3000/en" />
        <link rel="alternate" hrefLang="pt-BR" href="http://localhost:3000/pt-BR" />
        <link rel="alternate" hrefLang="x-default" href="http://localhost:3000" />
        <meta
          property="og:locale"
          content={locale === 'en' ? 'en_US' : locale === 'pt-BR' ? 'pt_BR' : 'es_MX'}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers initialLocale={locale}>{children}</Providers>
        <Toaster theme="system" position="top-right" richColors />
      </body>
    </html>
  );
}
