// SPDX-License-Identifier: AGPL-3.0-or-later
import { AUTH_DEFAULTS } from '@dhanam-core/shared';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuditModule } from '@core/audit/audit.module';
import { SecurityConfigService } from '@core/config/security.config';
import { CryptoModule } from '@core/crypto/crypto.module';
import { LoggerModule } from '@core/logger/logger.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { RedisModule } from '@core/redis/redis.module';
import { OnboardingModule } from '@modules/onboarding/onboarding.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GuestAuthService } from './guest-auth.service';
import { AUTH_PROVIDER, LocalAuthProvider, LocalMfaProvider, MFA_PROVIDER } from './providers';
import { SessionService } from './session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TotpService } from './totp.service';

/**
 * Authentication module — dhanam-core (local mode only).
 *
 * The full product also supports an external OIDC single-sign-on provider. That
 * integration is NOT part of the open core; dhanam-core authenticates users
 * with local, self-hosted JWT + refresh-token sessions and TOTP 2FA.
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: (configService.get<string>('jwt.accessExpiry') ??
            AUTH_DEFAULTS.JWT_EXPIRY) as typeof AUTH_DEFAULTS.JWT_EXPIRY,
          issuer: 'dhanam-api',
          audience: 'dhanam-web',
        },
      }),
    }),
    PrismaModule,
    LoggerModule,
    RedisModule,
    AuditModule,
    CryptoModule,
    forwardRef(() => OnboardingModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TotpService,
    SessionService,
    GuestAuthService,
    SecurityConfigService,
    JwtStrategy,
    LocalStrategy,
    LocalAuthProvider,
    LocalMfaProvider,
    { provide: AUTH_PROVIDER, useExisting: LocalAuthProvider },
    { provide: MFA_PROVIDER, useExisting: LocalMfaProvider },
  ],
  exports: [
    AuthService,
    TotpService,
    SessionService,
    GuestAuthService,
    SecurityConfigService,
    AUTH_PROVIDER,
    MFA_PROVIDER,
  ],
})
export class AuthModule {}
