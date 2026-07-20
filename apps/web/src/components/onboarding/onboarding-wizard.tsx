'use client';

import { Card, CardHeader, CardTitle, CardContent, Button, Progress } from '@dhanam-core/ui';
import { Check, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const DISMISS_KEY = 'dhanam_onboarding_dismissed';

interface OnboardingWizardProps {
  accountCount: number;
  budgetCount: number;
  goalCount: number;
}

interface Step {
  label: string;
  href: string;
  completed: boolean;
}

export function OnboardingWizard({ accountCount, budgetCount, goalCount }: OnboardingWizardProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_KEY);
    setDismissed(stored === 'true');
  }, []);

  if (dismissed) return null;
  if (accountCount >= 2 || budgetCount > 0) return null;

  const steps: Step[] = [
    { label: 'Connect an Account', href: '/accounts', completed: accountCount > 0 },
    { label: 'Set Up a Budget', href: '/budgets', completed: budgetCount > 0 },
    { label: 'Create a Goal', href: '/goals', completed: goalCount > 0 },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold">Get Started with Dhanam</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={handleDismiss}
          aria-label="Dismiss onboarding"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completedCount} of {steps.length} complete
            </span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          {steps.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              className="flex flex-1 items-center gap-2 rounded-md border p-3 text-sm transition-colors hover:bg-muted/50"
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  step.completed
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-muted-foreground/40'
                }`}
              >
                {step.completed && <Check className="h-3 w-3" />}
              </div>
              <span className={step.completed ? 'text-muted-foreground line-through' : ''}>
                {step.label}
              </span>
              {!step.completed && (
                <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
