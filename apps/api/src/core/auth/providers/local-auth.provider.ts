// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  AuthTokens,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from '@dhanam-core/shared';
import { Injectable } from '@nestjs/common';

import { AuthService } from '../auth.service';

import { AuthProvider } from './auth-provider.interface';

/**
 * Local auth provider — wraps the existing AuthService behind the AuthProvider
 * interface. Used when AUTH_MODE=local (self-hosted / standalone).
 */
@Injectable()
export class LocalAuthProvider implements AuthProvider {
  constructor(private readonly authService: AuthService) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    return this.authService.register(dto);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    return this.authService.login(dto);
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    return this.authService.refreshTokens({ refreshToken });
  }

  async logout(refreshToken: string): Promise<void> {
    return this.authService.logout(refreshToken);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(dto);
  }
}
