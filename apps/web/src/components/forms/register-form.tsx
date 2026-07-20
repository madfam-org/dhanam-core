'use client';

import { RegisterDto, useTranslation } from '@dhanam-core/shared';
import { Button, Checkbox, Input, Label } from '@dhanam-core/ui';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useGeoDefaults } from '@/lib/hooks/use-geo-defaults';
import { zodResolver } from '@/lib/zod-resolver';

interface RegisterFormProps {
  onSubmit: (data: RegisterDto) => void;
  isLoading?: boolean;
}

export function RegisterForm({ onSubmit, isLoading }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const geo = useGeoDefaults();
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const { t: tv } = useTranslation('validations');

  const registerSchema = useMemo(
    () =>
      z
        .object({
          email: z.string().email(tv('emailInvalid')),
          password: z
            .string()
            .min(8, tv('passwordMinLength', { min: '8' }))
            .regex(/[A-Z]/, tv('passwordUppercase'))
            .regex(/[0-9]/, tv('passwordNumber')),
          confirmPassword: z.string(),
          name: z.string().min(2, tv('nameMinLength', { min: '2' })),
          locale: z.enum(['en', 'es', 'pt-BR']).optional(),
          timezone: z.string().optional(),
          acceptTerms: z.literal(true, {
            message: tv('termsRequired'),
          }),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: tv('passwordsDoNotMatch'),
          path: ['confirmPassword'],
        }),
    [tv]
  );

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      locale: geo.locale,
      timezone: geo.timezone,
      // Cast required: schema demands `true` literal but checkbox starts unchecked.
      // Validation enforces `true` on submit; TS just needs assignability for default.
      acceptTerms: false as unknown as true,
    },
  });

  const acceptTerms = watch('acceptTerms');

  return (
    <form
      onSubmit={handleSubmit(({ acceptTerms: _accept, confirmPassword: _confirm, ...data }) =>
        onSubmit(data)
      )}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">{t('fullName')}</Label>
        <Input
          id="name"
          type="text"
          placeholder={t('placeholders.fullName')}
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

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
        <p className="text-xs text-muted-foreground">{t('passwordHelp')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t('confirmPassword')}
            {...register('confirmPassword')}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            aria-label={showConfirmPassword ? tc('aria.hidePassword') : tc('aria.showPassword')}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('creatingAccount')}
          </>
        ) : (
          t('createAccount')
        )}
      </Button>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Checkbox
            id="acceptTerms"
            checked={acceptTerms}
            onCheckedChange={(checked) =>
              setValue('acceptTerms', (checked === true) as true, { shouldValidate: true })
            }
            disabled={isLoading}
            className="mt-0.5"
          />
          <Label
            htmlFor="acceptTerms"
            className="text-xs text-muted-foreground font-normal leading-tight cursor-pointer"
          >
            {t('agreementPrefix')}{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              {t('termsOfService')}
            </Link>{' '}
            {tc('and')}{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              {t('privacyPolicy')}
            </Link>
          </Label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
        )}
      </div>
    </form>
  );
}
