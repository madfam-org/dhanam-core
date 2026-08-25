// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

interface RequiredEnvVar {
  name: string;
  description: string;
  productionOnly?: boolean;
}

@Injectable()
export class EnvValidationService implements OnModuleInit {
  private readonly logger = new Logger(EnvValidationService.name);
  private readonly requiredVars: RequiredEnvVar[] = [
    {
      name: 'JWT_SECRET',
      description: 'Secret key for signing JWT access tokens (min 32 characters)',
    },
    {
      name: 'DATABASE_URL',
      description: 'PostgreSQL connection string',
    },
    {
      name: 'REDIS_HOST',
      description: 'Redis host for session storage',
    },
  ];

  onModuleInit() {
    this.validateEnvironment();
  }

  private validateEnvironment(): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const errors: string[] = [];

    for (const envVar of this.requiredVars) {
      // Skip production-only variables in development
      if (envVar.productionOnly && !isProduction) {
        continue;
      }

      const value = process.env[envVar.name];

      if (!value || value.trim() === '') {
        errors.push(`${envVar.name}: ${envVar.description}`);
      }

      // Validate JWT_SECRET minimum length
      if (envVar.name === 'JWT_SECRET' && value && value.length < 32) {
        errors.push(`${envVar.name}: Must be at least 32 characters (currently ${value.length})`);
      }
    }

    if (errors.length > 0) {
      const errorMessage = [
        '\n',
        '='.repeat(80),
        'ENVIRONMENT VALIDATION FAILED',
        '='.repeat(80),
        'The following required environment variables are missing or invalid:',
        '',
        ...errors.map((err) => `  ❌ ${err}`),
        '',
        'Please check your .env file and ensure all required variables are set.',
        'See apps/api/.env.example for reference.',
        '='.repeat(80),
        '\n',
      ].join('\n');

      throw new Error(errorMessage);
    }

    this.logger.log('Environment validation passed');
  }

  /**
   * Validate a specific environment variable exists
   */
  static requireEnvVar(name: string, description?: string): string {
    const value = process.env[name];

    if (!value || value.trim() === '') {
      throw new Error(
        `Missing required environment variable: ${name}${description ? ` (${description})` : ''}`
      );
    }

    return value;
  }

  /**
   * Get an environment variable with a default value (only for non-sensitive config)
   */
  static getEnvVar(name: string, defaultValue: string): string {
    return process.env[name] || defaultValue;
  }
}
