import { Injectable } from '@nestjs/common';

type CsvField<T extends Record<string, unknown>> = {
  key: keyof T;
  label: string;
};

@Injectable()
export class ExportService {
  toCsv<T extends Record<string, unknown>>(data: T[], fields: CsvField<T>[]): Buffer {
    const headerRow = fields.map((field) => this.escape(String(field.label))).join(',');
    const dataRows = data.map((row) =>
      fields
        .map((field) => {
          const value = row[field.key];
          return this.escape(value == null ? '' : String(value));
        })
        .join(',')
    );

    const csvBody = [headerRow, ...dataRows].join('\n');
    const utf8Bom = Buffer.from([0xef, 0xbb, 0xbf]);
    return Buffer.concat([utf8Bom, Buffer.from(csvBody, 'utf8')]);
  }

  private escape(value: string): string {
    const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const hasSpecial = /[",\n]/.test(normalized);
    if (!hasSpecial) {
      return normalized;
    }

    return `"${normalized.replace(/"/g, '""')}"`;
  }
}
