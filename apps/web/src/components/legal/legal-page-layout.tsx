'use client';

import { useTranslation } from '@dhanam-core/shared';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LegalSection {
  title: string;
  content: string;
  subsections?: { title: string; content: string }[];
}

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  intro: string;
  sections: LegalSection[];
  lastUpdated?: string;
}

export function LegalPageLayout({
  title,
  subtitle,
  intro,
  sections,
  lastUpdated,
}: LegalPageLayoutProps) {
  const { t } = useTranslation('legal');

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground no-underline mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToHome')}
        </Link>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        {lastUpdated && (
          <p className="text-sm text-muted-foreground">{t('lastUpdated', { date: lastUpdated })}</p>
        )}
      </div>

      <p className="text-base leading-relaxed mb-8">{intro}</p>

      <nav className="mb-8 p-4 bg-muted/50 rounded-lg">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3">
          {t('tableOfContents')}
        </h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          {sections.map((section, i) => (
            <li key={i}>
              <a href={`#section-${i}`} className="text-primary hover:underline">
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((section, i) => (
        <section key={i} id={`section-${i}`} className="mb-8">
          <h2 className="text-xl font-semibold mb-3">
            {i + 1}. {section.title}
          </h2>
          <p className="text-base leading-relaxed">{section.content}</p>
          {section.subsections?.map((sub, j) => (
            <div key={j} className="ml-4 mt-4">
              <h3 className="text-lg font-medium mb-2">{sub.title}</h3>
              <p className="text-base leading-relaxed">{sub.content}</p>
            </div>
          ))}
        </section>
      ))}

      <hr className="my-8" />
      <p className="text-sm text-muted-foreground">
        {t('questionsContact')}{' '}
        <a href="mailto:legal@example.com" className="text-primary">
          legal@example.com
        </a>
      </p>
    </article>
  );
}
