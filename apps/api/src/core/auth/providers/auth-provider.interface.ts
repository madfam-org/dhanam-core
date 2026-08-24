// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  AuthTokens,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from '@dhanam-core/shared';

import { TotpSetupResponse } from '../totp.service';

// ─────────────────────────────────────────────────────────────────────────────
// Auth Provider Interface
// ─────────────────────────────────────────────────────────────────────────────
// The controller injects AUTH_PROVIDER and delegates to it. dhanam-core ships a
// single local implementation; the interface is kept so self-hosters can plug
// in their own provider.
// ─────────────────────────────────────────────────────────────────────────────

export const AUTH_PROVIDER = Symbol('AUTH_PROVIDER');
export const MFA_PROVIDER = Symbol('MFA_PROVIDER');

export type AuthMode = 'local';

export interface AuthProvider {
  register(dto: RegisterDto): Promise<AuthTokens>;
  login(dto: LoginDto): Promise<AuthTokens>;
  refreshTokens(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  forgotPassword(dto: ForgotPasswordDto): Promise<void>;
  resetPassword(dto: ResetPasswordDto): Promise<void>;
}

export interface MfaProvider {
  setupTotp(userId: string, email: string): Promise<TotpSetupResponse>;
  enableTotp(userId: string, code: string): Promise<void>;
  disableTotp(userId: string, code: string): Promise<void>;
  verifyToken(secret: string, code: string): boolean;
  verifyEncryptedToken(encryptedSecret: string, code: string): boolean;
  generateBackupCodes(): string[];
  storeBackupCodes(userId: string, codes: string[]): Promise<void>;
  verifyBackupCode(userId: string, code: string): Promise<boolean>;
}
