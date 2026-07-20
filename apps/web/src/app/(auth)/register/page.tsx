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
} from '@dhanam-core/ui';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { LocaleSwitcher } from '~/components/locale-switcher';
import { authApi } from '~/lib/api/auth';
import { ApiError } from '~/lib/api/client';
import { useAuth } from '~/lib/hooks/use-auth';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const { t } = useTranslation('auth');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: () => authApi.register({ name, email, password }),
    onSuccess: (response) => {
      setAuth(response.user, response.tokens);
      router.push('/onboarding');
    },
    onError: (err: ApiError) => {
      setError(err?.message || 'Could not create your account');
    },
  });

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-end">
        <LocaleSwitcher />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('registerTitle') || 'Create your account'}</CardTitle>
          <CardDescription>{t('registerSubtitle') || ''}</CardDescription>
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
              registerMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? '…' : t('signUp') || 'Sign up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <div className="text-center w-full">
            {t('haveAccount') || 'Already have an account?'}{' '}
            <Link href="/login" className="text-primary hover:underline">
              {t('loginTitle') || 'Sign in'}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
