'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
} from '@dhanam-core/ui';
import Link from 'next/link';
import { useState } from 'react';

import { apiClient } from '~/lib/api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch {
      // Always show the same message regardless of outcome (no account enumeration).
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link if an account exists.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <Alert>
            <AlertDescription>
              If that email is registered, a reset link has been sent.
            </AlertDescription>
          </Alert>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '…' : 'Send reset link'}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
