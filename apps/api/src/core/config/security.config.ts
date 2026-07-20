// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AUTH_DEFAULTS,
  RATE_LIMIT_PRESETS,
  RateLimitConfig,
  SECURITY_HEADERS,
  SHUTDOWN_TIMEOUT_MS,
  TIME_UNITS,
} from '@dhanam-core/shared';

/**
 * Centralised security configuration.
 * Every value is read from the environment with a sensible fallback
 * from the shared `AUTH_DEFAULTS` / `RATE_LIMIT_PRESETS` constants.
 */
@Injectable()
export class SecurityConfigService {
  constructor(private config: ConfigService) {}

  // ── JWT ──────────────────────────────────────────────────────────────────

  getJwtExpiry(): string {
    return (
      this.config.get<string>('jwt.accessExpiry') ??
      this.config.get<string>('JWT_EXPIRES_IN') ??
      this.config.get<string>('JWT_ACCESS_EXPIRY') ??
      AUTH_DEFAULTS.JWT_EXPIRY
    );
  }

  getJwtExpirySeconds(): number {
    const raw = this.getJwtExpiry();
    return this.parseTimeToSeconds(raw);
  }

  // ── Refresh Tokens ───────────────────────────────────────────────────────

  getRefreshTokenExpiryDays(): number {
    return (
      this.config.get<number>('REFRESH_TOKEN_EXPIRY_DAYS') ??
      AUTH_DEFAULTS.REFRESH_TOKEN_EXPIRY_DAYS
    );
  }

  getRefreshTokenExpirySeconds(): number {
    return this.getRefreshTokenExpiryDays() * TIME_UNITS.DAY_SECONDS;
  }

  getRefreshTokenExpiryMs(): number {
    return this.getRefreshTokenExpirySeconds() * 1000;
  }

  // ── Login Lockout ────────────────────────────────────────────────────────

  getMaxLoginAttempts(): number {
    return this.config.get<number>('MAX_LOGIN_ATTEMPTS') ?? AUTH_DEFAULTS.MAX_LOGIN_ATTEMPTS;
  }

  getAccountLockoutMinutes(): number {
    return (
      this.config.get<number>('ACCOUNT_LOCKOUT_MINUTES') ?? AUTH_DEFAULTS.ACCOUNT_LOCKOUT_MINUTES
    );
  }

  getAccountLockoutSeconds(): number {
    return this.getAccountLockoutMinutes() * TIME_UNITS.MINUTE_SECONDS;
  }

  // ── Password Breach Check ────────────────────────────────────────────────

  getPasswordBreachCheckTimeoutMs(): number {
    return (
      this.config.get<number>('PASSWORD_BREACH_CHECK_TIMEOUT_MS') ??
      AUTH_DEFAULTS.PASSWORD_BREACH_CHECK_TIMEOUT_MS
    );
  }

  // ── Demo Tokens ──────────────────────────────────────────────────────────

  getDemoAccessTokenExpiry(): string {
    return (
      this.config.get<string>('DEMO_ACCESS_TOKEN_EXPIRY') ?? AUTH_DEFAULTS.DEMO_ACCESS_TOKEN_EXPIRY
    );
  }

  getDemoRefreshTokenExpiry(): string {
    return (
      this.config.get<string>('DEMO_REFRESH_TOKEN_EXPIRY') ??
      AUTH_DEFAULTS.DEMO_REFRESH_TOKEN_EXPIRY
    );
  }

  getDemoAccessTokenExpirySeconds(): number {
    return (
      this.config.get<number>('DEMO_ACCESS_TOKEN_EXPIRY_SECONDS') ??
      AUTH_DEFAULTS.DEMO_ACCESS_TOKEN_EXPIRY_SECONDS
    );
  }

  // ── Rate Limiting ────────────────────────────────────────────────────────

  getRateLimitConfig(endpoint: string): RateLimitConfig {
    const envLimit = this.config.get<number>(`RATE_LIMIT_${endpoint.toUpperCase()}_LIMIT`);
    const envTtl = this.config.get<number>(`RATE_LIMIT_${endpoint.toUpperCase()}_TTL`);
    const preset = RATE_LIMIT_PRESETS[endpoint];

    return {
      limit: envLimit ?? preset?.limit ?? 60,
      ttl: envTtl ?? preset?.ttl ?? 60,
    };
  }

  // ── Security Headers ─────────────────────────────────────────────────────

  getHstsMaxAge(): number {
    return this.config.get<number>('HSTS_MAX_AGE_SECONDS') ?? SECURITY_HEADERS.HSTS_MAX_AGE_SECONDS;
  }

  // ── Shutdown ─────────────────────────────────────────────────────────────

  getShutdownTimeoutMs(): number {
    return this.config.get<number>('SHUTDOWN_TIMEOUT_MS') ?? SHUTDOWN_TIMEOUT_MS;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private parseTimeToSeconds(value: string): number {
    const match = value.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 900; // 15m fallback
    const num = parseInt(match[1], 10);
    switch (match[2]) {
      case 's':
        return num;
      case 'm':
        return num * TIME_UNITS.MINUTE_SECONDS;
      case 'h':
        return num * TIME_UNITS.HOUR_SECONDS;
      case 'd':
        return num * TIME_UNITS.DAY_SECONDS;
      default:
        return 900;
    }
  }
}