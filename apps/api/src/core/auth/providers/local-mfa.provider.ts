// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from '@nestjs/common';

import { TotpService, TotpSetupResponse } from '../totp.service';

import { MfaProvider } from './auth-provider.interface';

/**
 * Local MFA provider — wraps the existing TotpService behind the MfaProvider
 * interface. Used when AUTH_MODE=local (self-hosted / standalone).
 */
@Injectable()
export class LocalMfaProvider implements MfaProvider {
  constructor(private readonly totpService: TotpService) {}

  async setupTotp(userId: string, email: string): Promise<TotpSetupResponse> {
    return this.totpService.setupTotp(userId, email);
  }

  async enableTotp(userId: string, code: string): Promise<void> {
    return this.totpService.enableTotp(userId, code);
  }

  async disableTotp(userId: string, code: string): Promise<void> {
    return this.totpService.disableTotp(userId, code);
  }

  verifyToken(secret: string, code: string): boolean {
    return this.totpService.verifyToken(secret, code);
  }

  verifyEncryptedToken(encryptedSecret: string, code: string): boolean {
    return this.totpService.verifyEncryptedToken(encryptedSecret, code);
  }

  generateBackupCodes(): string[] {
    return this.totpService.generateBackupCodes();
  }

  async storeBackupCodes(userId: string, codes: string[]): Promise<void> {
    return this.totpService.storeBackupCodes(userId, codes);
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    return this.totpService.verifyBackupCode(userId, code);
  }
}