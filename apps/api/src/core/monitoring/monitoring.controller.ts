// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { HealthService } from './health.service';
import { MetricsService } from './metrics.service';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  private readonly logger = new Logger(MonitoringController.name);

  constructor(
    private readonly healthService: HealthService,
    private readonly metricsService: MetricsService
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  @ApiResponse({ status: 503, description: 'System is unhealthy' })
  async getHealth(@Res() reply: FastifyReply) {
    const status = await this.healthService.getHealthStatus();
    const httpStatus =
      status.status === 'unhealthy' ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.OK;
    return reply.status(httpStatus).send(status);
  }

  @Get('health/ready')
  @ApiOperation({
    summary: 'Readiness probe for Kubernetes - returns 503 if not ready for traffic',
  })
  @ApiResponse({ status: 200, description: 'Service is ready for traffic' })
  @ApiResponse({ status: 503, description: 'Service is not ready for traffic' })
  async getReady(@Res() reply: FastifyReply) {
    const status = await this.healthService.getReadinessStatus();
    const httpStatus = status.ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return reply.status(httpStatus).send(status);
  }

  @Get('health/live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes - returns 200 if process is alive' })
  @ApiResponse({ status: 200, description: 'Process is alive' })
  async getLive() {
    return this.healthService.getLivenessStatus();
  }

  // Keep legacy endpoints for backwards compatibility
  @Get('health/readiness')
  @ApiOperation({ summary: 'Get system readiness status (legacy - use /health/ready)' })
  @ApiResponse({ status: 200, description: 'Readiness status retrieved successfully' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async getReadiness(@Res() reply: FastifyReply) {
    const status = await this.healthService.getReadinessStatus();
    const httpStatus = status.ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return reply.status(httpStatus).send(status);
  }

  @Get('health/liveness')
  @ApiOperation({ summary: 'Get system liveness status (legacy - use /health/live)' })
  @ApiResponse({ status: 200, description: 'Liveness status retrieved successfully' })
  async getLiveness() {
    return this.healthService.getLivenessStatus();
  }

  @Post('csp-reports')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Receive Content-Security-Policy violation reports' })
  @ApiResponse({ status: 204, description: 'Report received' })
  handleCspReport(@Body() report: Record<string, unknown>) {
    this.logger.warn('CSP violation report', JSON.stringify(report));
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get system metrics (admin only)' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  async getMetrics() {
    return this.metricsService.getSystemMetrics();
  }

  @Get('metrics/resources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get resource usage metrics (admin only)' })
  @ApiResponse({ status: 200, description: 'Resource metrics retrieved successfully' })
  getResourceMetrics() {
    return this.metricsService.getResourceMetrics();
  }
}