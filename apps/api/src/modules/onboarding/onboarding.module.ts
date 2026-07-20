// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuditModule } from '@core/audit/audit.module';
import { CoreModule } from '@core/core.module';
import { MailerModule } from '@core/mailer/mailer.module';
import { PreferencesModule } from '@modules/preferences/preferences.module';

import { OnboardingAnalytics } from './onboarding.analytics';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [
    CoreModule,
    AuditModule,
    MailerModule,
    PreferencesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_ACCESS_EXPIRY', '15m') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [OnboardingService, OnboardingAnalytics],
  controllers: [OnboardingController],
  exports: [OnboardingService, OnboardingAnalytics],
})
export class OnboardingModule {}