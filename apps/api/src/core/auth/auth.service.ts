// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash } from 'crypto';

import {
  LoginDto,
  RegisterDto,
  AuthTokens,
  RefreshTokenDto,
  ResetPasswordDto,
  ForgotPasswordDto,
} from '@dhanam-core/shared';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
  OnModuleDestroy,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import Redis from 'ioredis';

import { AuditService } from '@core/audit/audit.service';
import { SecurityConfigService } from '@core/config/security.config';
import { LoggerService } from '@core/logger/logger.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { MailerService } from '@core/mailer/mailer.service';
import { OnboardingService } from '@modules/onboarding/onboarding.service';

import { SessionService } from './session.service';
import { TotpService } from './totp.service';

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService implements OnModuleDestroy {
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private logger: LoggerService,
    private sessionService: SessionService,
    private totpService: TotpService,
    @Inject(forwardRef(() => MailerService))
    private emailService: MailerService,
    @Inject(forwardRef(() => OnboardingService))
    private onboardingService: OnboardingService,
    private auditService: AuditService,
    private securityConfig: SecurityConfigService
  ) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
    } catch {
      this.logger.warn?.('Redis quit failed during AuthService teardown; disconnecting socket');
      this.redis.disconnect();
    }
  }

  /**
   * Check password against Have I Been Pwned API using k-anonymity
   */
  private async checkPasswordBreach(password: string): Promise<boolean> {
    try {
      // SHA1 is required by the HIBP k-anonymity API protocol — NOT used for password storage (Argon2id below)
      const hash = createHash('sha1').update(password).digest('hex').toUpperCase(); // lgtm[js/insufficient-password-hash]
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.securityConfig.getPasswordBreachCheckTimeoutMs()
      );

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Dhanam-Ledger-Security-Check' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) return false; // Fail open - don't block registration if API is down

      const text = await response.text();
      return text.split('\n').some((line) => line.split(':')[0] === suffix);
    } catch {
      return false; // Fail open
    }
  }

  private async checkAccountLocked(email: string): Promise<boolean> {
    const key = `lockout:${email}`;
    const locked = await this.redis.get(key);
    return locked === 'locked';
  }

  private async recordFailedLogin(email: string): Promise<void> {
    const lockoutSeconds = this.securityConfig.getAccountLockoutSeconds();
    const maxAttempts = this.securityConfig.getMaxLoginAttempts();
    const attemptsKey = `login_attempts:${email}`;
    const attempts = await this.redis.incr(attemptsKey);
    await this.redis.expire(attemptsKey, lockoutSeconds);

    if (attempts >= maxAttempts) {
      const lockoutKey = `lockout:${email}`;
      await this.redis.set(lockoutKey, 'locked', 'EX', lockoutSeconds);
      await this.redis.del(attemptsKey);

      // Audit lockout event
      await this.auditService.logSuspiciousActivity('ACCOUNT_LOCKED', undefined, undefined, {
        email,
        attempts,
        lockoutMinutes: this.securityConfig.getAccountLockoutMinutes(),
      });
    }
  }

  private async clearLoginAttempts(email: string): Promise<void> {
    await this.redis.del(`login_attempts:${email}`);
  }

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Check password against breach database
    const isBreached = await this.checkPasswordBreach(dto.password);
    if (isBreached) {
      throw new BadRequestException(
        'This password has been found in a data breach. Please choose a different password.'
      );
    }

    // Hash password with Argon2id
    const hashedPassword = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: hashedPassword,
        locale: dto.locale || 'es',
        timezone: dto.timezone || 'America/Mexico_City',
      },
    });

    // Create default personal space
    await this.prisma.space.create({
      data: {
        name: `${dto.name}'s Personal`,
        type: 'personal',
        currency: 'MXN',
        timezone: user.timezone,
        userSpaces: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
    });

    this.logger.log(`User registered: ${user.id}`, 'AuthService');

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);

    // Send an email-verification message at signup.
    // Fire-and-forget: a mail failure must not block registration.
    this.onboardingService
      .sendEmailVerification(user.id)
      .catch((err) =>
        this.logger.warn(`Signup verification email failed: ${err.message}`, 'AuthService')
      );

    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    // Check if account is locked
    const isLocked = await this.checkAccountLocked(dto.email);
    if (isLocked) {
      throw new UnauthorizedException(
        'Account temporarily locked. Please try again in 15 minutes.'
      );
    }

    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      await this.recordFailedLogin(dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check TOTP if enabled
    if (user.totpSecret) {
      if (!dto.totpCode) {
        throw new UnauthorizedException('TOTP code required');
      }

      const isValidTotp = this.totpService.verifyEncryptedToken(user.totpSecret, dto.totpCode);

      if (!isValidTotp) {
        throw new UnauthorizedException('Invalid TOTP code');
      }
    }

    // Clear failed login attempts on success
    await this.clearLoginAttempts(dto.email);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`User logged in: ${user.email}`, 'AuthService');

    return this.generateTokens(user.id, user.email);
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthTokens> {
    const sessionData = await this.sessionService.validateRefreshToken(dto.refreshToken);

    if (!sessionData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Invalidate old refresh token
    await this.sessionService.revokeRefreshToken(dto.refreshToken);

    // Generate new tokens
    return this.generateTokens(sessionData.userId, sessionData.email);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessionService.revokeRefreshToken(refreshToken);
    this.logger.log('User logged out', 'AuthService');
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    const resetToken = await this.sessionService.createPasswordResetToken(user.id);

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    this.logger.log(`Password reset requested for user: ${user.id}`, 'AuthService');
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const userId = await this.sessionService.validatePasswordResetToken(dto.token);

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check password against breach database
    const isBreached = await this.checkPasswordBreach(dto.newPassword);
    if (isBreached) {
      throw new BadRequestException(
        'This password has been found in a data breach. Please choose a different password.'
      );
    }

    const hashedPassword = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    // Revoke all sessions for this user
    await this.sessionService.revokeAllUserSessions(userId);

    // Security notice: confirm the change to the account owner. If they did
    // not initiate it, this is their first (and only) signal to act.
    this.emailService
      .sendPasswordChangedEmail(updatedUser.email, updatedUser.name ?? '')
      .catch((err) =>
        this.logger.warn(`Password-changed email failed to queue: ${err.message}`, 'AuthService')
      );

    this.logger.log(`Password reset for user: ${userId}`, 'AuthService');
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        totpSecret: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await argon2.verify(user.passwordHash, password);

    if (!isValidPassword) {
      return null;
    }

    const { passwordHash: _passwordHash, ...result } = user;
    return result;
  }

  private async generateTokens(userId: string, email: string): Promise<AuthTokens> {
    // Note: iat and exp are handled by JWT signOptions in auth.module.ts
    const payload = {
      sub: userId,
      email,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.sessionService.createRefreshToken(userId, email);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.securityConfig.getJwtExpirySeconds(),
    };
  }
}