// SPDX-License-Identifier: AGPL-3.0-or-later
import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { Currency } from '@db';

import { FxRatesService } from './fx-rates.service';

class GetRateDto {
  @IsEnum(Currency)
  from: Currency;

  @IsEnum(Currency)
  to: Currency;

  @IsOptional()
  @IsDateString()
  date?: string;
}

class ConvertAmountDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(Currency)
  from: Currency;

  @IsEnum(Currency)
  to: Currency;

  @IsOptional()
  @IsDateString()
  date?: string;
}

class HistoricalRatesDto {
  @IsEnum(Currency)
  from: Currency;

  @IsEnum(Currency)
  to: Currency;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

@ApiTags('FX Rates')
@Controller('fx-rates')
export class FxRatesController {
  constructor(private readonly fxRatesService: FxRatesService) {}

  @Get('rate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get exchange rate between two currencies' })
  @ApiQuery({ name: 'from', enum: Currency, description: 'Source currency' })
  @ApiQuery({ name: 'to', enum: Currency, description: 'Target currency' })
  @ApiQuery({ name: 'date', required: false, description: 'Date for historical rate (ISO 8601)' })
  @ApiOkResponse({ description: 'Exchange rate retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBadRequestResponse({ description: 'Invalid currency parameters' })
  async getRate(@Query() query: GetRateDto) {
    const date = query.date ? new Date(query.date) : undefined;
    const rate = await this.fxRatesService.getExchangeRate(query.from, query.to, date);

    return {
      from: query.from,
      to: query.to,
      rate,
      date: date || new Date(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('convert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert amount between currencies' })
  @ApiQuery({ name: 'amount', description: 'Amount to convert' })
  @ApiQuery({ name: 'from', enum: Currency, description: 'Source currency' })
  @ApiQuery({ name: 'to', enum: Currency, description: 'Target currency' })
  @ApiQuery({ name: 'date', required: false, description: 'Date for historical rate (ISO 8601)' })
  @ApiOkResponse({ description: 'Amount converted successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBadRequestResponse({ description: 'Invalid amount or currency parameters' })
  async convertAmount(@Query() query: ConvertAmountDto) {
    const date = query.date ? new Date(query.date) : undefined;
    const convertedAmount = await this.fxRatesService.convertAmount(
      query.amount,
      query.from,
      query.to,
      date
    );

    const rate = await this.fxRatesService.getExchangeRate(query.from, query.to, date);

    return {
      originalAmount: query.amount,
      convertedAmount,
      from: query.from,
      to: query.to,
      rate,
      date: date || new Date(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('historical')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get historical exchange rates' })
  @ApiQuery({ name: 'from', enum: Currency, description: 'Source currency' })
  @ApiQuery({ name: 'to', enum: Currency, description: 'Target currency' })
  @ApiQuery({ name: 'startDate', description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', description: 'End date (ISO 8601)' })
  @ApiOkResponse({ description: 'Historical rates retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBadRequestResponse({ description: 'Invalid date range or currency parameters' })
  async getHistoricalRates(@Query() query: HistoricalRatesDto) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const rates = await this.fxRatesService.getHistoricalRates(
      query.from,
      query.to,
      startDate,
      endDate
    );

    return {
      from: query.from,
      to: query.to,
      startDate,
      endDate,
      rates: rates.map((r) => ({
        date: r.date,
        rate: r.rate,
        source: r.source,
      })),
      count: rates.length,
    };
  }

  @Get('currencies')
  @ApiOperation({ summary: 'Get supported currencies' })
  @ApiOkResponse({ description: 'Supported currencies retrieved successfully' })
  async getSupportedCurrencies() {
    const currencies = await this.fxRatesService.getSupportedCurrencies();

    return {
      currencies,
      count: currencies.length,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check FX rates service health' })
  @ApiOkResponse({ description: 'Service health status' })
  async getHealth() {
    // Test by getting current USD/MXN rate
    try {
      const rate = await this.fxRatesService.getExchangeRate(Currency.USD, Currency.MXN);

      return {
        service: 'fx-rates',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        testRate: {
          from: 'USD',
          to: 'MXN',
          rate,
        },
      };
    } catch {
      return {
        service: 'fx-rates',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch exchange rates',
      };
    }
  }
}
