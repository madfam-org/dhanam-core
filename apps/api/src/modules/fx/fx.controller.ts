// SPDX-License-Identifier: AGPL-3.0-or-later
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import {
  FxHistoryResponse,
  FxRateResponse,
  FxRatesBatchResponse,
  GetFxHistoryQueryDto,
  GetFxRateQueryDto,
  GetFxRatesBatchQueryDto,
} from './dto/fx-rate.dto';
import { FxService } from './fx.service';

/**
 * FX read API.
 *
 * Mounted at `/v1/fx/*` (global prefix `v1` is set in `apps/api/src/main.ts`).
 *
 * All endpoints require a valid JWT (see the auth module) and are read-only:
 * rates are looked up from the provider chain, cache, or stored history.
 */
@ApiTags('FX (platform service)')
@ApiBearerAuth()
@Controller('fx')
@UseGuards(JwtAuthGuard)
export class FxController {
  constructor(private readonly fx: FxService) {}

  @Get('rate')
  @ApiOperation({
    summary: 'Get a single FX rate (spot | dof | settled)',
    description: 'Caller MUST pick the rate type — spot ≠ dof ≠ settled.',
  })
  @ApiOkResponse({ description: 'Rate retrieved' })
  @ApiBadRequestResponse({ description: 'Invalid currency code or rate type' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async getRate(@Query() q: GetFxRateQueryDto): Promise<FxRateResponse> {
    return this.fx.getRate({
      from: q.from,
      to: q.to,
      type: q.type,
      at: q.at ? new Date(q.at) : undefined,
      paymentId: q.payment_id,
      allowStale: q.allow_stale === undefined || q.allow_stale === 'true',
    });
  }

  @Get('rates')
  @ApiOperation({
    summary: 'Batch FX rates (one base, many targets)',
    description: 'Fan-out is best-effort; failed pairs are silently skipped.',
  })
  @ApiOkResponse({ description: 'Rates retrieved' })
  async getRates(@Query() q: GetFxRatesBatchQueryDto): Promise<FxRatesBatchResponse> {
    const targets = GetFxRatesBatchQueryDto.parseTargets(q.targets);
    return this.fx.getRatesBatch({
      base: q.base,
      targets,
      type: q.type,
      at: q.at ? new Date(q.at) : undefined,
    });
  }

  @Get('history')
  @ApiOperation({
    summary: 'Historical rate series for a currency pair',
    description:
      'For type=dof reads from publications; otherwise from the observation log. Inclusive on both bounds.',
  })
  @ApiOkResponse({ description: 'History retrieved' })
  async getHistory(@Query() q: GetFxHistoryQueryDto): Promise<FxHistoryResponse> {
    return this.fx.getHistory({
      from: q.from,
      to: q.to,
      type: q.type,
      fromDate: new Date(q.from_date),
      toDate: new Date(q.to_date),
    });
  }
}
