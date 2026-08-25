// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Log Sanitizer - Removes sensitive data from log output
 *
 * This utility ensures that sensitive information like passwords, tokens,
 * and secrets are never logged in plain text, protecting against accidental
 * exposure in log files or monitoring systems.
 */

export class LogSanitizer {
  /**
   * List of sensitive field names that should be redacted
   * Matches both exact keys and partial matches (e.g., 'token', 'Token', 'access_token')
   */
  private static readonly SENSITIVE_PATTERNS = [
    // Authentication & Tokens
    'password',
    'passwordHash',
    'newPassword',
    'oldPassword',
    'currentPassword',
    'token',
    'accessToken',
    'refreshToken',
    'resetToken',
    'bearerToken',
    'apiKey',
    'apiSecret',
    'secret',
    'secretKey',
    'privateKey',

    // TOTP & 2FA
    'totp',
    'totpSecret',
    'totpTempSecret',
    'totpCode',
    'mfaCode',
    'backupCode',
    'otpCode',

    // Provider Credentials
    'encryptedToken',
    'encryptedCredentials',
    'providerToken',
    'plaidAccessToken',
    'belvoToken',
    'bitsoApiKey',
    'bitsoApiSecret',

    // Encryption
    'encryptionKey',
    'kmsKey',
    'privateKey',
    'publicKey',
    'certificate',

    // Payment & Financial
    'cardNumber',
    'cvv',
    'pin',
    'ssn',
    'taxId',
    'accountNumber',
    'routingNumber',

    // Personal Data
    'ssn',
    'passport',
    'driverLicense',
  ];

  /**
   * Redaction marker for sensitive data
   */
  private static readonly REDACTED = '[REDACTED]';

  /**
   * Sanitizes any value by recursively checking for sensitive fields
   *
   * @param data - The data to sanitize (can be object, array, string, etc.)
   * @param depth - Current recursion depth (prevents infinite loops)
   * @returns Sanitized copy of the data
   */
  static sanitize(data: any, depth = 0): any {
    // Prevent deep recursion
    if (depth > 10) {
      return '[MAX_DEPTH_REACHED]';
    }

    // Handle null and undefined
    if (data === null || data === undefined) {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item, depth + 1));
    }

    // Handle objects
    if (typeof data === 'object') {
      // Handle Date objects
      if (data instanceof Date) {
        return data;
      }

      // Handle Error objects
      if (data instanceof Error) {
        return {
          name: data.name,
          message: this.sanitizeString(data.message),
          stack: this.sanitizeString(data.stack),
        };
      }

      // Handle plain objects
      const sanitized: any = {};

      for (const [key, value] of Object.entries(data)) {
        // Check if the key is sensitive
        if (this.isSensitiveKey(key)) {
          sanitized[key] = this.REDACTED;
        } else {
          sanitized[key] = this.sanitize(value, depth + 1);
        }
      }

      return sanitized;
    }

    // Handle strings (check for potential token patterns)
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    // Return primitive types as-is
    return data;
  }

  /**
   * Checks if a key name indicates sensitive data
   */
  private static isSensitiveKey(key: string): boolean {
    const lowerKey = key.toLowerCase();

    // Exact matches for common non-sensitive fields containing sensitive words
    const nonSensitiveExact = [
      'tokencount',
      'tokencounter',
      'tokentype',
      'tokenlimit',
      'secretsanta',
    ];

    if (nonSensitiveExact.includes(lowerKey)) {
      return false;
    }

    return this.SENSITIVE_PATTERNS.some((pattern) => lowerKey.includes(pattern.toLowerCase()));
  }

  /**
   * Sanitizes strings by redacting potential JWT tokens
   * JWTs have the pattern: xxxxx.yyyyy.zzzzz (base64 encoded parts separated by dots)
   */
  private static sanitizeString(str: string | undefined): string {
    if (!str) return '';

    // Regex to detect JWT-like patterns (three base64 sections separated by dots)
    const jwtPattern = /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g;

    // Replace JWT-like patterns with [REDACTED_TOKEN]
    return str.replace(jwtPattern, '[REDACTED_TOKEN]');
  }

  /**
   * Sanitizes error objects specifically
   * Useful for exception logging
   */
  static sanitizeError(error: Error | any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: this.sanitizeString(error.message),
        stack: error.stack
          ? error.stack
              .split('\n')
              .map((line) => this.sanitizeString(line))
              .join('\n')
          : undefined,
        ...this.sanitize(error),
      };
    }

    return this.sanitize(error);
  }

  /**
   * Sanitizes HTTP request objects
   * Commonly used in request logging interceptors
   */
  static sanitizeRequest(req: any): any {
    return {
      method: req.method,
      url: req.url,
      headers: this.sanitizeHeaders(req.headers),
      query: this.sanitize(req.query),
      params: this.sanitize(req.params),
      body: this.sanitize(req.body),
      ip: req.ip,
      userAgent: req.headers?.['user-agent'],
    };
  }

  /**
   * Sanitizes HTTP headers (Authorization, cookies, etc.)
   */
  private static sanitizeHeaders(headers: any): any {
    if (!headers) return {};

    const sanitized = { ...headers };

    // Always redact these headers
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token'];

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = this.REDACTED;
      }
      if (sanitized[header.toLowerCase()]) {
        sanitized[header.toLowerCase()] = this.REDACTED;
      }
    }

    return sanitized;
  }
}
