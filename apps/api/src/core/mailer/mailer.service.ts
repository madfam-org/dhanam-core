// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

/**
 * Open-core mailer stub.
 *
 * The full Dhanam product ships a closed-source email module containing branded
 * HTML templates and transactional-email-provider credentials (SMTP / Resend).
 * That module is intentionally NOT part of dhanam-core.
 *
 * This stub preserves the method surface the application relies on, but does not
 * send anything — it logs the intent at debug level. Self-hosters can replace
 * this class with their own transport (nodemailer, a provider SDK, etc.).
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  private log(kind: string, to: string): void {
    this.logger.debug(`[mailer stub] would send "${kind}" email to ${to}`);
  }

  async sendPasswordResetEmail(
    to: string,
    _name?: string | null,
    _token?: string
  ): Promise<void> {
    this.log('password-reset', to);
  }

  async sendPasswordChangedEmail(to: string, _name?: string | null): Promise<void> {
    this.log('password-changed', to);
  }

  async sendEmailVerification(
    to: string,
    _data?: string | Record<string, unknown>
  ): Promise<void> {
    this.log('email-verification', to);
  }

  async sendWelcomeEmail(to: string, _name?: string | null): Promise<void> {
    this.log('welcome', to);
  }

  async sendOnboardingComplete(
    to: string,
    _data?: string | Record<string, unknown>
  ): Promise<void> {
    this.log('onboarding-complete', to);
  }

  async sendTwoFactorEnabledEmail(to: string, _name?: string | null): Promise<void> {
    this.log('two-factor-enabled', to);
  }

  async sendTwoFactorDisabledEmail(to: string, _name?: string | null): Promise<void> {
    this.log('two-factor-disabled', to);
  }

  async sendTemplateEmail(to: string, template: string, _data?: Record<string, unknown>): Promise<void> {
    this.log(`template:${template}`, to);
  }
}
