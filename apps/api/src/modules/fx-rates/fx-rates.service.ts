// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';

import { MonitorPerformance } from '@core/decorators/monitor-performance.decorator';
import { Currency } from '@db';

import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';

interface BanxicoApiResponse {
  bmx: {
    series: Array<{
      idSerie: string;
      titulo: string;
      datos: Array<{
        fecha: string;
        dato: string;
      }>;
    }>;
  };
}

interface ExchangeRate {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  date: Date;
  source: string;
}

@Injectable()
export class FxRatesService {
  private readonly logger = new Logger(FxRatesService.name);
  private readonly BANXICO_TOKEN: string;
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly BANXICO_BASE_URL = 'https://www.banxico.org.mx/SieAPIRest/service/v1/series';

  // Banxico series IDs
  private readonly SERIES_IDS = {
    USD_MXN: 'SF43718', // USD to MXN
    EUR_MXN: 'SF46410', // EUR to MXN
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly redisService: RedisService
  ) {
    this.BANXICO_TOKEN = this.configService.get('BANXICO_API_TOKEN', '');
    if (!this.BANXICO_TOKEN) {
      this.logger.warn('Banxico API token not configured, using fallback rates');
    }
  }

  @MonitorPerformance(3000)
  async getExchangeRate(
    fromCurrency: Currency,
    toCurrency: Currency,
    date?: Date
  ): Promise<number> {
    // Handle same currency
    if (fromCurrency === toCurrency) return 1;

    // Try cache first
    const cacheKey = `fx:${fromCurrency}:${toCurrency}:${date?.toISOString() || 'latest'}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return parseFloat(cached);
    }

    try {
      let rate: number;

      // Determine which API to use based on currency pair
      if (fromCurrency === Currency.USD && toCurrency === Currency.MXN) {
        rate = await this.getBanxicoRate(this.SERIES_IDS.USD_MXN, date);
      } else if (fromCurrency === Currency.MXN && toCurrency === Currency.USD) {
        const usdToMxn = await this.getBanxicoRate(this.SERIES_IDS.USD_MXN, date);
        rate = 1 / usdToMxn;
      } else if (fromCurrency === Currency.EUR && toCurrency === Currency.MXN) {
        rate = await this.getBanxicoRate(this.SERIES_IDS.EUR_MXN, date);
      } else if (fromCurrency === Currency.MXN && toCurrency === Currency.EUR) {
        const eurToMxn = await this.getBanxicoRate(this.SERIES_IDS.EUR_MXN, date);
        rate = 1 / eurToMxn;
      } else if (fromCurrency === Currency.USD && toCurrency === Currency.EUR) {
        // Cross rate calculation
        const usdToMxn = await this.getBanxicoRate(this.SERIES_IDS.USD_MXN, date);
        const eurToMxn = await this.getBanxicoRate(this.SERIES_IDS.EUR_MXN, date);
        rate = usdToMxn / eurToMxn;
      } else if (fromCurrency === Currency.EUR && toCurrency === Currency.USD) {
        // Cross rate calculation
        const usdToMxn = await this.getBanxicoRate(this.SERIES_IDS.USD_MXN, date);
        const eurToMxn = await this.getBanxicoRate(this.SERIES_IDS.EUR_MXN, date);
        rate = eurToMxn / usdToMxn;
      } else {
        // Fallback for unsupported pairs
        rate = await this.getFallbackRate(fromCurrency, toCurrency);
      }

      // Cache the result
      await this.redisService.set(cacheKey, rate.toString(), this.CACHE_TTL);

      // Store in database for historical tracking
      await this.storeExchangeRate({
        fromCurrency,
        toCurrency,
        rate,
        date: date || new Date(),
        source: 'banxico',
      });

      return rate;
    } catch (error) {
      this.logger.error(`Failed to get exchange rate for ${fromCurrency}/${toCurrency}:`, error);

      // Try to get from database
      const dbRate = await this.getLatestFromDatabase(fromCurrency, toCurrency);
      if (dbRate) return dbRate;

      // Fallback to hardcoded rates
      return this.getFallbackRate(fromCurrency, toCurrency);
    }
  }

  private async getBanxicoRate(seriesId: string, date?: Date): Promise<number> {
    if (!this.BANXICO_TOKEN) {
      throw new Error('Banxico API token not configured');
    }

    const dateStr = date ? date.toISOString().split('T')[0] : 'oportuno';
    const url = `${this.BANXICO_BASE_URL}/${seriesId}/datos/${dateStr}/${dateStr}?token=${this.BANXICO_TOKEN}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<BanxicoApiResponse>(url, {
          headers: {
            Accept: 'application/json',
          },
        })
      );

      const series = response.data.bmx.series[0];
      if (!series || !series.datos || series.datos.length === 0) {
        throw new Error('No data returned from Banxico API');
      }

      const latestData = series.datos[series.datos.length - 1];
      return parseFloat(latestData?.dato || '1');
    } catch (error) {
      this.logger.error(`Failed to fetch from Banxico API:`, error);
      throw error;
    }
  }

  private async getFallbackRate(fromCurrency: Currency, toCurrency: Currency): Promise<number> {
    // Hardcoded fallback rates (as of typical 2024 values)
    const fallbackRates: Record<string, number> = {
      USD_MXN: 17.5,
      MXN_USD: 0.057,
      EUR_MXN: 19.2,
      MXN_EUR: 0.052,
      USD_EUR: 0.91,
      EUR_USD: 1.1,
    };

    const key = `${fromCurrency}_${toCurrency}`;
    return fallbackRates[key] || 1;
  }

  private async getLatestFromDatabase(
    fromCurrency: Currency,
    toCurrency: Currency
  ): Promise<number | null> {
    const rate = await this.prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return rate?.rate || null;
  }

  private async storeExchangeRate(data: ExchangeRate): Promise<void> {
    try {
      await this.prisma.exchangeRate.upsert({
        where: {
          fromCurrency_toCurrency_date: {
            fromCurrency: data.fromCurrency,
            toCurrency: data.toCurrency,
            date: data.date,
          },
        },
        update: {
          rate: data.rate,
          source: data.source,
          updatedAt: new Date(),
        },
        create: data,
      });
    } catch (error) {
      this.logger.error('Failed to store exchange rate:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async updateExchangeRates(): Promise<void> {
    this.logger.log('Updating exchange rates from Banxico');

    try {
      // Update all major currency pairs
      const pairs = [
        { from: Currency.USD, to: Currency.MXN },
        { from: Currency.EUR, to: Currency.MXN },
      ];

      for (const pair of pairs) {
        await this.getExchangeRate(pair.from, pair.to);
      }

      this.logger.log('Exchange rates updated successfully');
    } catch (error) {
      this.logger.error('Failed to update exchange rates:', error);
    }
  }

  async convertAmount(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency,
    date?: Date
  ): Promise<number> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency, date);
    return Math.round(amount * rate * 100) / 100; // Round to 2 decimals
  }

  async getHistoricalRates(
    fromCurrency: Currency,
    toCurrency: Currency,
    startDate: Date,
    endDate: Date
  ): Promise<ExchangeRate[]> {
    return this.prisma.exchangeRate.findMany({
      where: {
        fromCurrency,
        toCurrency,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async getSupportedCurrencies(): Promise<Currency[]> {
    return [Currency.MXN, Currency.USD, Currency.EUR];
  }
}
