// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'];
    const userId = (request as any).user?.id;

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logRequest(method, url, statusCode, duration, {
            ip,
            userAgent,
            userId,
            responseSize:
              data != null
                ? Array.isArray(data)
                  ? `~${data.length} items`
                  : typeof data === 'object'
                    ? `~${Object.keys(data as object).length} keys`
                    : 'scalar'
                : 0,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode || 500;

          this.logRequest(method, url, statusCode, duration, {
            ip,
            userAgent,
            userId,
            error: error.message,
          });
        },
      })
    );
  }

  private logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    metadata: Record<string, unknown>
  ) {
    const logLevel = this.getLogLevel(statusCode);
    const message = `${method} ${url} ${statusCode} - ${duration}ms`;

    switch (logLevel) {
      case 'error':
        this.logger.error(message, JSON.stringify(metadata));
        break;
      case 'warn':
        this.logger.warn(message, JSON.stringify(metadata));
        break;
      case 'debug':
        this.logger.debug(message, JSON.stringify(metadata));
        break;
      default:
        this.logger.log(message, JSON.stringify(metadata));
    }
  }

  private getLogLevel(statusCode: number): 'error' | 'warn' | 'log' | 'debug' {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    if (statusCode >= 300) return 'debug';
    return 'log';
  }
}