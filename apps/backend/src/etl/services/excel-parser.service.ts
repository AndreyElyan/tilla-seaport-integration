import { Injectable, Logger } from "@nestjs/common";
import { RawExcelRow } from "../dto/seaport-row.dto";
import { Workbook } from "exceljs";

@Injectable()
export class ExcelParserService {
  private readonly logger = new Logger(ExcelParserService.name);

  async parse(buffer: Buffer): Promise<RawExcelRow[]> {
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      this.logger.error("No worksheet found in the Excel file.");
      return [];
    }

    this.logger.log(
      `Parsing worksheet: ${worksheet.name} with ${worksheet.rowCount} rows.`,
    );

    const headers: string[] = [];
    const rows: RawExcelRow[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = String(cell.value ?? "").trim();
        });

        return;
      }

      const rowData: RawExcelRow = {};

      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          rowData[header] = cell.value;
        }
      });
      rows.push(rowData);
    });

    this.logger.log(
      `Finished parsing. Total rows parsed: ${rows.length} data rows with headers: [${headers.filter(Boolean).join(", ")}]`,
    );

    return rows;
  }
}
