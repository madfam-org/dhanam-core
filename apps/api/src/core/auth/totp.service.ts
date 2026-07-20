// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomBytes, createHash } from 'crypto';

import { Injectable } from '@nestjs/common';
import * as qrcode from 'qrcode';
import * as speakeasy from 'speakeasy';

import { CryptoService } from '@core/crypto/crypto.service';
import {
  SecurityException,
  InfrastructureException,
  ValidationException,
  BusinessRuleException,
} from '@core/exceptions/domain-exceptions';
import { isPrismaKnownRequestError } from '@core/filters/prisma-error.guard';
import { LoggerService } from '@core/logger/logger.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { MailerService } from '@core/mailer/mailer.service';

export interface TotpSetupResponse {
  qrCodeUrl: string;
  secret: string;
  manualEntryKey: string;
}

@Injectable()
export class TotpService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private cryptoService: CryptoService,
    private emailService: MailerService
  ) {}

  /** Fire a 2FA security notice without letting mail failures break the flow. */
  private async notifyTwoFactorChange(userId: string, enabled: boolean): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (!user?.email) return;
      if (enabled) {
        await this.emailService.sendTwoFactorEnabledEmail(user.email, user.name ?? '');
      } else {
        await this.emailService.sendTwoFactorDisabledEmail(user.email, user.name ?? '');
      }
    } catch (err) {
      this.logger.warn(
        `2FA ${enabled ? 'enabled' : 'disabled'} email failed to queue: ${(err as Error).message}`,
        'TotpService'
      );
    }
  }

  /**
   * Handle errors in TOTP operations with proper exception mapping
   */
  private handleError(error: unknown, operation: string): never {
    // Re-throw domain exceptions
    if (
      error instanceof SecurityException ||
      error instanceof ValidationException ||
      error instanceof BusinessRuleException
    ) {
      throw error;
    }

    // Handle Prisma errors
    if (isPrismaKnownRequestError(error)) {
      if (error.code === 'P2025') {
        throw BusinessRuleException.resourceNotFound('User', operation);
      }
      throw InfrastructureException.databaseError(operation, new Error(error.message));
    }

    // Log and wrap unknown errors
    this.logger.error(`TOTP operation failed: ${operation}`, String(error), 'TotpService');
    throw InfrastructureException.encryptionError(
      operation,
      error instanceof Error ? error : new Error(String(error))
    );
  }

  async setupTotp(userId: string, userEmail: string): Promise<TotpSetupResponse> {
    try {
      const secret = speakeasy.generateSecret({
        name: `Dhanam (${userEmail})`,
        issuer: 'Dhanam Ledger',
        length: 32,
      });

      // Generate QR code (wrap in try-catch for QR generation errors)
      let qrCodeUrl: string;
      try {
        qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);
      } catch (qrError) {
        this.logger.error('Failed to generate QR code', String(qrError), 'TotpService');
        throw InfrastructureException.encryptionError('qr_generation', qrError as Error);
      }

      // Store temporary secret (not activated until verified) - encrypted at rest
      await this.prisma.user.update({
        where: { id: userId },
        data: { totpTempSecret: this.cryptoService.encrypt(secret.base32) },
      });

      this.logger.log(`TOTP setup initiated for user: ${userId}`, 'TotpService');

      // speakeasy always generates these values

      const base32Secret = secret.base32!;

      return {
        qrCodeUrl,
        secret: base32Secret,
        manualEntryKey: base32Secret,
      };
    } catch (error) {
      this.handleError(error, 'setupTotp');
    }
  }

  async enableTotp(userId: string, token: string): Promise<void> {
    try {
      // Validate token format
      if (!token || !/^\d{6}$/.test(token)) {
        throw ValidationException.invalidInput('token', 'TOTP token must be 6 digits');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { totpTempSecret: true },
      });

      if (!user?.totpTempSecret) {
        throw ValidationException.invalidState('No TOTP setup in progress');
      }

      // Decrypt the temporary secret for verification
      const decryptedSecret = this.cryptoService.decrypt(user.totpTempSecret);

      const isValid = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps for clock drift
      });

      if (!isValid) {
        throw SecurityException.totpInvalid();
      }

      // Activate TOTP (keep encrypted)
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: user.totpTempSecret,
          totpTempSecret: null,
          totpEnabled: true,
        },
      });

      this.logger.log(`TOTP enabled for user: ${userId}`, 'TotpService');
      await this.notifyTwoFactorChange(userId, true);
    } catch (error) {
      this.handleError(error, 'enableTotp');
    }
  }

  async disableTotp(userId: string, token: string): Promise<void> {
    try {
      // Validate token format
      if (!token || !/^\d{6}$/.test(token)) {
        throw ValidationException.invalidInput('token', 'TOTP token must be 6 digits');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { totpSecret: true },
      });

      if (!user?.totpSecret) {
        throw ValidationException.invalidState('TOTP not enabled');
      }

      // Decrypt secret for verification
      const decryptedSecret = this.cryptoService.decrypt(user.totpSecret);
      const isValid = this.verifyToken(decryptedSecret, token);

      if (!isValid) {
        throw SecurityException.totpInvalid();
      }

      // Disable TOTP
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: null,
          totpTempSecret: null,
          totpEnabled: false,
        },
      });

      this.logger.log(`TOTP disabled for user: ${userId}`, 'TotpService');
      await this.notifyTwoFactorChange(userId, false);
    } catch (error) {
      this.handleError(error, 'disableTotp');
    }
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps for clock drift
    });
  }

  /**
   * Verify TOTP token with encrypted secret.
   * Decrypts the secret first, then verifies the token.
   */
  verifyEncryptedToken(encryptedSecret: string, token: string): boolean {
    const decryptedSecret = this.cryptoService.decrypt(encryptedSecret);
    return this.verifyToken(decryptedSecret, token);
  }

  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate cryptographically secure 8-character backup codes
      const code = randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  async storeBackupCodes(userId: string, codes: string[]): Promise<void> {
    try {
      // Hash backup codes before storing
      const hashedCodes = codes.map((code) => createHash('sha256').update(code).digest('hex'));

      await this.prisma.user.update({
        where: { id: userId },
        data: { totpBackupCodes: hashedCodes },
      });

      this.logger.log(`Backup codes generated for user: ${userId}`, 'TotpService');
    } catch (error) {
      this.handleError(error, 'storeBackupCodes');
    }
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      // Validate code format
      if (!code || !/^[A-F0-9]{8}$/i.test(code)) {
        return false;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { totpBackupCodes: true },
      });

      if (!user?.totpBackupCodes || user.totpBackupCodes.length === 0) {
        return false;
      }

      const hashedCode = createHash('sha256').update(code.toUpperCase()).digest('hex');
      const codeIndex = user.totpBackupCodes.indexOf(hashedCode);

      if (codeIndex === -1) {
        return false;
      }

      // Remove used backup code
      const updatedCodes = [...user.totpBackupCodes];
      updatedCodes.splice(codeIndex, 1);

      await this.prisma.user.update({
        where: { id: userId },
        data: { totpBackupCodes: updatedCodes },
      });

      this.logger.log(`Backup code used for user: ${userId}`, 'TotpService');
      return true;
    } catch (error) {
      // For verification, log but return false rather than throwing
      this.logger.error(
        `Failed to verify backup code for user ${userId}`,
        String(error),
        'TotpService'
      );
      return false;
    }
  }
}