// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Structured JSON Logging Configuration
 * Ready for Loki/ELK/Datadog ingestion.
 * SOC 2 Control: Centralized log aggregation.
 */

export interface StructuredLog {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  requestId?: string;
  userId?: string;
  context?: string;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
}

export const loggingConfig = {
  // Pino-compatible configuration
  pinoOptions: {
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label: string) => ({ level: label }),
      bindings: () => ({
        service: 'dhanam-api',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '0.1.0',
      }),
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    // Redact sensitive fields from logs
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        'passwordHash',
        'totpSecret',
        'encryptedToken',
        'accessToken',
        'refreshToken',
      ],
      censor: '[REDACTED]',
    },
  },

  // Fields to always include in structured logs
  baseFields: {
    service: 'dhanam-api',
    environment: process.env.NODE_ENV || 'development',
  },
};

/**
 * Create a structured log entry
 */
export function createStructuredLog(
  level: string,
  message: string,
  context?: string,
  metadata?: Record<string, any>
): StructuredLog {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'dhanam-api',
    context,
    metadata,
  };
}