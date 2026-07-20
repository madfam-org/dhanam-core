// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuditModule } from '@core/audit/audit.module';
import { AuthModule } from '@core/auth/auth.module';
import { CoreModule } from '@core/core.module';
import { EventsModule } from '@core/events/events.module';
import { MailerModule } from '@core/mailer/mailer.module';
import { MonitoringModule } from '@core/monitoring/monitoring.module';
import { QueueModule } from '@core/queue/queue.module';
import { RateLimitingModule } from '@core/security/rate-limiting.module';
import { AccountsModule } from '@modules/accounts/accounts.module';
import { AnalyticsModule } from '@modules/analytics/analytics.module';
import { BudgetsModule } from '@modules/budgets/budgets.module';
import { CategoriesModule } from '@modules/categories/categories.module';
import { DocumentsModule } from '@modules/documents/documents.module';
import { EstatePlanningModule } from '@modules/estate-planning/estate-planning.module';
import { FxModule } from '@modules/fx/fx.module';
import { FxRatesModule } from '@modules/fx-rates/fx-rates.module';
import { GoalsModule } from '@modules/goals/goals.module';
import { HouseholdsModule } from '@modules/households/households.module';
import { ManualAssetsModule } from '@modules/manual-assets/manual-assets.module';
import { OnboardingModule } from '@modules/onboarding/onboarding.module';
import { PreferencesModule } from '@modules/preferences/preferences.module';
import { RecurringModule } from '@modules/recurring/recurring.module';
import { SearchModule } from '@modules/search/search.module';
import { SimulationsModule } from '@modules/simulations/simulations.module';
import { SpacesModule } from '@modules/spaces/spaces.module';
import { TagsModule } from '@modules/tags/tags.module';
import { TransactionsModule } from '@modules/transactions/transactions.module';
import { UsersModule } from '@modules/users/users.module';

import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';

/**
 * Root application module for dhanam-core.
 *
 * Wires only the open-core domain modules: authentication, spaces/households,
 * accounts & transactions, budgets & categories, goals, recurring, tags,
 * manual assets, FX, documents & storage, analytics,
 * search, estate planning and probabilistic simulations.
 *
 * The global {@link MailerModule} and {@link QueueModule} are no-op stubs that
 * stand in for the proprietary email and background-job subsystems (see their
 * source for details).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      cache: true,
    }),
    CoreModule,
    MailerModule,
    QueueModule,
    EventsModule,
    AuthModule,
    RateLimitingModule,
    AuditModule,
    MonitoringModule,
    UsersModule,
    SpacesModule,
    HouseholdsModule,
    AccountsModule,
    TransactionsModule,
    BudgetsModule,
    CategoriesModule,
    RecurringModule,
    TagsModule,
    GoalsModule,
    ManualAssetsModule,
    DocumentsModule,
    EstatePlanningModule,
    SimulationsModule,
    AnalyticsModule,
    SearchModule,
    FxModule,
    FxRatesModule,
    PreferencesModule,
    OnboardingModule,
  ],
})
export class AppModule {}
