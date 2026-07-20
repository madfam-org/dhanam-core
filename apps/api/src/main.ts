// SPDX-License-Identifier: AGPL-3.0-or-later
import { SECURITY_HEADERS, SHUTDOWN_TIMEOUT_MS } from '@dhanam-core/shared';
import fastifyCompress from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyCsrfProtection from '@fastify/csrf-protection';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { GlobalExceptionFilter } from '@core/filters/global-exception.filter';
import { LoggingInterceptor } from '@core/interceptors/logging.interceptor';
import { RequestIdMiddleware } from '@core/middleware/request-id.middleware';
import { HealthService } from '@core/monitoring/health.service';
import { SentryService } from '@core/monitoring/sentry.service';
import { QueueService } from '@core/queue/queue.service';
import { resolveClientIp } from '@core/security/client-ip.util';
import { isShowcaseRateLimitBypass } from '@core/security/showcase-request.util';

import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  // Setup global error handlers for unhandled rejections and exceptions
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      trustProxy: process.env.TRUST_PROXY !== 'false',
    })
  );

  const configService = app.get(ConfigService);

  // Global prefix and versioning
  app.setGlobalPrefix('v1');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Cookie support (required for httpOnly refresh tokens)
  await app.register(fastifyCookie as any, {
    secret: configService.get('COOKIE_SECRET') || configService.get('JWT_SECRET'),
  });

  // CSRF protection (double-submit cookie pattern, skip safe methods)
  await app.register(fastifyCsrfProtection as any, {
    cookieOpts: { signed: true, httpOnly: true, sameSite: 'strict', secure: true, path: '/' },
  });

  // Security headers
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        reportUri: ['/v1/csp-reports'],
      },
    },
    hsts: {
      maxAge: SECURITY_HEADERS.HSTS_MAX_AGE_SECONDS,
      includeSubDomains: true,
      preload: true,
    },
  });

  // CORS configuration
  const corsOrigins = configService.get('CORS_ORIGINS');
  await app.register(fastifyCors as any, {
    origin: corsOrigins ? corsOrigins.split(',') : ['http://localhost:3000'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // Compression
  await app.register(fastifyCompress as any, { encodings: ['gzip', 'deflate'] });

  // Multipart form data (for document uploads)
  await app.register(fastifyMultipart as any, {
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB max per file
      files: 1, // one file per request
    },
  });

  // Rate limiting. E2E runs boot the production entrypoint with NODE_ENV=test
  // and need deterministic auth/bootstrap calls without global IP throttling.
  if (configService.get('NODE_ENV') !== 'test') {
    const healthPaths = [
      '/v1/monitoring/health',
      '/v1/monitoring/health/live',
      '/v1/monitoring/health/ready',
      '/v1/monitoring/ready',
      '/metrics',
      '/health',
      '/health/full',
      '/ready',
    ];

    await app.register(fastifyRateLimit as any, {
      max: configService.get('RATE_LIMIT_MAX')
        ? parseInt(configService.get('RATE_LIMIT_MAX')!)
        : 300,
      timeWindow: (configService.get('RATE_LIMIT_WINDOW') as string) || '15 minutes',
      keyGenerator: (req: { ip?: string; headers?: Record<string, unknown> }) =>
        resolveClientIp(req),
      allowList: (req: { url?: string; headers?: Record<string, unknown> }) => {
        const path = req.url?.split('?')[0] || '';
        if (healthPaths.includes(path)) {
          return true;
        }
        return isShowcaseRateLimitBypass(req);
      },
    });
  }

  // Global middleware and filters
  app.use(new RequestIdMiddleware().use);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Dhanam Core API')
      .setDescription('Personal-finance budgeting, tracking and wealth-planning API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  // Enable shutdown hooks for graceful termination
  app.enableShutdownHooks();

  // Setup graceful shutdown handler
  const healthService = app.get(HealthService);
  const queueService = app.get(QueueService);
  const sentryService = app.get(SentryService);

  const gracefulShutdown = async (signal: string) => {
    logger.log(`Received ${signal}, starting graceful shutdown...`);

    healthService.setShuttingDown(true);
    logger.log('Health service marked as shutting down');

    await new Promise((resolve) => setTimeout(resolve, SHUTDOWN_TIMEOUT_MS));
    logger.log('Grace period complete, draining queues...');

    try {
      await queueService.drainQueues(30000);
      logger.log('Queue drain complete');
    } catch (error) {
      logger.warn('Queue drain timed out or failed:', error);
    }

    try {
      await sentryService.flush(2000);
      logger.log('Sentry events flushed');
    } catch (error) {
      logger.warn('Sentry flush failed:', error);
    }

    logger.log('Closing application...');
    await app.close();
    logger.log('Application closed, exiting');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Root-level health endpoints (outside /v1 prefix) for external monitoring
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.get('/health', async (_request, reply) => {
    const status = await healthService.getBasicHealthStatus();
    const code = status.status === 'unhealthy' ? 503 : 200;
    return reply.status(code).send(status);
  });

  // Full health check (database, redis, queues, external services)
  fastifyInstance.get('/health/full', async (_request, reply) => {
    const status = await healthService.getHealthStatus();
    const code = status.status === 'unhealthy' ? 503 : 200;
    return reply.status(code).send(status);
  });

  const port = configService.get('PORT') || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application started on port ${port}`);
}

bootstrap();
