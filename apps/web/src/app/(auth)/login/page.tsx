'use client';

import { useTranslation } from '@dhanam-core/shared';
import {
  Card,
  CardContent,
  CardFooter,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
  Separator,
} from '@dhanam-core/ui';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { LocaleSwitcher } from '~/components/locale-switcher';
import { authApi } from '~/lib/api/auth';
import { ApiError } from '~/lib/api/client';
import { useAuth } from '~/lib/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (response) => {
      setAuth(response.user, response.tokens);
      router.push('/dashboard');
    },
    onError: (err: ApiError) => {
      setError(err?.message || 'Invalid email or password');
    },
  });

  const guestLoginMutation = useMutation({
    mutationFn: authApi.loginAsGuest,
    onSuccess: (response) => {
      setAuth(response.user, response.tokens);
      router.push('/dashboard');
    },
    onError: () => setError('Could not start a guest session'),
  });

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('loginTitle')}</CardTitle>
          <CardDescription>{t('loginSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              loginMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? '…' : t('loginTitle')}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('orContinueWith') || 'Or'}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setError(null);
              guestLoginMutation.mutate({});
            }}
            disabled={guestLoginMutation.isPending}
          >
            {guestLoginMutation.isPending ? '…' : 'Continue as guest'}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 text-sm text-muted-foreground">
          <Link href="/forgot-password" className="text-primary hover:underline">
            {t('forgotPassword')}
          </Link>
          <div className="text-center">
            {t('noAccount')}{' '}
            <Link href="/register" className="text-primary hover:underline">
              {t('signUp')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
