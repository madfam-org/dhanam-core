'use client';

import { LoginDto, useTranslation } from '@dhanam-core/shared';
import { Button, Input, Label } from '@dhanam-core/ui';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { zodResolver } from '@/lib/zod-resolver';

interface LoginFormProps {
  onSubmit: (data: LoginDto) => void;
  isLoading?: boolean;
  showTotpField?: boolean;
}

export function LoginForm({ onSubmit, isLoading, showTotpField }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const { t: tv } = useTranslation('validations');

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(tv('emailInvalid')),
        password: z.string().min(8, tv('passwordMinLength', { min: '8' })),
        totpCode: z.string().optional(),
      }),
    [tv]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    shouldFocusError: false,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('placeholders.email')}
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('placeholders.password')}
            {...register('password')}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            aria-label={showPassword ? tc('aria.hidePassword') : tc('aria.showPassword')}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      {showTotpField && (
        <div className="space-y-2">
          <Label htmlFor="totpCode">{t('totpCode')}</Label>
          <Input
            id="totpCode"
            type="text"
            placeholder={t('placeholders.totpCode')}
            maxLength={6}
            {...register('totpCode')}
            disabled={isLoading}
          />
          {errors.totpCode && <p className="text-sm text-destructive">{errors.totpCode.message}</p>}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('signingIn')}
          </>
        ) : (
          t('loginButton')
        )}
      </Button>
    </form>
  );
}
