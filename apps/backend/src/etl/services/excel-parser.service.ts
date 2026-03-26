import { Injectable, Logger } from "@nestjs/common";
import type { CellValue } from "exceljs";
import { Workbook } from "exceljs";
import type { RawExcelRow } from "../dto/seaport-row.dto";

function extractCellText(value: CellValue): unknown {
  if (value == null) return undefined;

  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((part) => part.text).join("");
  }

  if (typeof value === "object" && "text" in value) {
    return (value as { text: string }).text;
  }

  if (typeof value === "object" && "result" in value) {
    return extractCellText((value as { result: CellValue }).result);
  }

  return value;
}

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

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      const text = extractCellText(cell.value);
      headers[colNumber] = String(text ?? "")
        .trim()
        .toLowerCase();
    });

    const colCount = headers.length;

    for (let r = 2; r <= worksheet.rowCount; r++) {
      const row = worksheet.getRow(r);
      const rowData: RawExcelRow = {};

      for (let c = 1; c < colCount; c++) {
        const header = headers[c];
        if (!header) continue;
        const value = extractCellText(row.getCell(c).value);
        if (value !== undefined) {
          rowData[header] = value;
        }
      }

      if (Object.keys(rowData).length > 0) {
        rows.push(rowData);
      }
    }

    this.logger.log(
      `Finished parsing. Total rows parsed: ${rows.length} data rows with headers: [${headers.filter(Boolean).join(", ")}]`,
    );

    return rows;
  }
}
