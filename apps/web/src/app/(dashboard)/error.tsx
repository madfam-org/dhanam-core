'use client';

import { Button, Card, CardContent } from '@dhanam-core/ui';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center pt-8 pb-6">
          <div className="rounded-full bg-destructive/10 p-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-6">
            An unexpected error occurred. Please try again or return to the dashboard.
          </p>
          <div className="flex gap-3">
            <Button onClick={reset} variant="default">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-4">Error ID: {error.digest}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
