// SPDX-License-Identifier: AGPL-3.0-or-later
/* eslint-disable no-console */
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LogSanitizer } from './log-sanitizer';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly isDevelopment: boolean;

  constructor(private readonly _configService: ConfigService) {
    this.isDevelopment = this._configService.get('NODE_ENV') === 'development';
  }

  log(message: any, context?: string) {
    const sanitizedMessage = LogSanitizer.sanitize(message);

    if (this.isDevelopment) {
      console.log(`[${context || 'Application'}]`, sanitizedMessage);
    } else {
      console.log(
        JSON.stringify({
          level: 'info',
          message: sanitizedMessage,
          context,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  error(message: any, trace?: string, context?: string) {
    const sanitizedMessage = LogSanitizer.sanitize(message);
    const sanitizedTrace = trace ? LogSanitizer.sanitize(trace) : undefined;

    if (this.isDevelopment) {
      console.error(`[${context || 'Application'}]`, sanitizedMessage, sanitizedTrace);
    } else {
      console.error(
        JSON.stringify({
          level: 'error',
          message: sanitizedMessage,
          trace: sanitizedTrace,
          context,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  warn(message: any, context?: string) {
    const sanitizedMessage = LogSanitizer.sanitize(message);

    if (this.isDevelopment) {
      console.warn(`[${context || 'Application'}]`, sanitizedMessage);
    } else {
      console.warn(
        JSON.stringify({
          level: 'warn',
          message: sanitizedMessage,
          context,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  debug(message: any, context?: string) {
    const sanitizedMessage = LogSanitizer.sanitize(message);

    if (this.isDevelopment) {
      console.debug(`[${context || 'Application'}]`, sanitizedMessage);
    }
  }

  verbose(message: any, context?: string) {
    const sanitizedMessage = LogSanitizer.sanitize(message);

    if (this.isDevelopment) {
      console.log(`[VERBOSE][${context || 'Application'}]`, sanitizedMessage);
    }
  }
}