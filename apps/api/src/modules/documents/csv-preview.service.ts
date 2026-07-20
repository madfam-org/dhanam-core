// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'csv-parse';

import { R2StorageService } from '../storage/r2.service';

export interface CsvPreviewResult {
  headers: string[];
  rows: string[][];
  totalRows: number;
  delimiter: string;
  previewRowCount: number;
}

@Injectable()
export class CsvPreviewService {
  private readonly logger = new Logger(CsvPreviewService.name);

  constructor(private r2Storage: R2StorageService) {}

  /**
   * Generate a preview of a CSV file stored in R2
   */
  async generatePreview(r2Key: string, maxRows: number = 20): Promise<CsvPreviewResult> {
    const buffer = await this.r2Storage.downloadFile(r2Key);
    const content = buffer.toString('utf-8');
    const delimiter = this.detectDelimiter(content);

    return new Promise((resolve, reject) => {
      const rows: string[][] = [];
      let headers: string[] = [];
      let totalRows = 0;

      const parser = parse({
        delimiter,
        relax_column_count: true,
        skip_empty_lines: true,
        trim: true,
      });

      parser.on('readable', () => {
        let record: string[];
        while ((record = parser.read()) !== null) {
          if (totalRows === 0) {
            headers = record;
          } else if (rows.length < maxRows) {
            rows.push(record);
          }
          totalRows++;
        }
      });

      parser.on('error', (err) => {
        this.logger.error(`CSV parse error for ${r2Key}: ${err.message}`);
        reject(err);
      });

      parser.on('end', () => {
        // totalRows includes the header row, so data rows = totalRows - 1
        const dataRowCount = Math.max(0, totalRows - 1);

        resolve({
          headers,
          rows,
          totalRows: dataRowCount,
          delimiter,
          previewRowCount: rows.length,
        });
      });

      parser.write(content);
      parser.end();
    });
  }

  /**
   * Detect the delimiter used in a CSV file by counting occurrences in the first few lines
   */
  detectDelimiter(content: string): string {
    const lines = content.split('\n').slice(0, 5);
    const candidates: Record<string, number> = {
      ',': 0,
      ';': 0,
      '\t': 0,
      '|': 0,
    };

    for (const line of lines) {
      for (const [delim] of Object.entries(candidates)) {
        candidates[delim] += line.split(delim).length - 1;
      }
    }

    // Return delimiter with highest count, defaulting to comma
    let best = ',';
    let bestCount = 0;
    for (const [delim, count] of Object.entries(candidates)) {
      if (count > bestCount) {
        best = delim;
        bestCount = count;
      }
    }

    return best;
  }
}