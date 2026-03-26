import { Injectable, Logger } from "@nestjs/common";
import type { PrismaService } from "../../prisma/prisma.service";
import type { SyncResult, ValidatedSeaportRow } from "../dto/seaport-row.dto";
import type { BlobStorageService } from "./blob-storage.service";
import type { ExcelParserService } from "./excel-parser.service";
import type { SeaportMapperService } from "./seaport-mapper.service";
import type { SeaportValidatorService } from "./seaport-validator.service";

const BATCH_SIZE = 25;

@Injectable()
export class SeaportSyncService {
  private readonly logger = new Logger(SeaportSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blobStorage: BlobStorageService,
    private readonly excelParser: ExcelParserService,
    private readonly mapper: SeaportMapperService,
    private readonly validator: SeaportValidatorService,
  ) {}

  async sync(): Promise<SyncResult> {
    const start = Date.now();
    this.logger.log("Starting seaport sync...");

    const sasUrl = process.env.AZURE_BLOB_SAS_URL;
    if (!sasUrl) {
      throw new Error(
        "AZURE_BLOB_SAS_URL is not defined in environment variables",
      );
    }

    // Step 1: Download Excel files from Azure Blob
    this.logger.log("Step 1: Downloading Excel files from Azure Blob...");
    const buffers = await this.blobStorage.downloadExcelFiles(sasUrl);
    this.logger.log(`Downloaded ${buffers.length} file(s)`);

    // Step 2: Parse Excel files
    this.logger.log("Step 2: Parsing Excel files...");
    const rawRows = (
      await Promise.all(buffers.map((buf) => this.excelParser.parse(buf)))
    ).flat();
    this.logger.log(`Parsed ${rawRows.length} total raw rows`);

    // Step 3: Map columns
    this.logger.log("Step 3: Mapping columns...");
    const mappedRows = this.mapper.mapRows(rawRows);
    this.logger.log(`Mapped ${mappedRows.length} rows`);

    // Step 4: Validate
    this.logger.log("Step 4: Validating rows...");
    const { valid, invalid } = this.validator.validate(mappedRows);
    this.logger.log(
      `Validation result: ${valid.length} valid, ${invalid.length} invalid`,
    );

    // Step 5: Upsert in batches
    this.logger.log(
      `Step 5: Upserting ${valid.length} rows in batches of ${BATCH_SIZE}...`,
    );
    let upsertedRows = 0;

    for (let i = 0; i < valid.length; i += BATCH_SIZE) {
      const batch = valid.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(valid.length / BATCH_SIZE);

      this.logger.log(
        `Processing batch ${batchNumber}/${totalBatches} (${batch.length} rows)`,
      );

      const count = await this.upsertBatch(batch);
      upsertedRows += count;
    }

    const duration = Date.now() - start;

    const result: SyncResult = {
      totalRows: rawRows.length,
      validRows: valid.length,
      invalidRows: invalid.length,
      upsertedRows,
      errors: invalid.map(({ rowIndex, reasons }) => ({ rowIndex, reasons })),
      duration,
    };

    this.logger.log(
      `Sync complete in ${duration}ms: ${upsertedRows} upserted, ${invalid.length} invalid out of ${rawRows.length} total rows`,
    );

    return result;
  }

  private async upsertBatch(rows: ValidatedSeaportRow[]): Promise<number> {
    let count = 0;

    for (const row of rows) {
      try {
        await this.prisma.seaport.upsert({
          where: { locode: row.locode },
          update: {
            portName: row.portName,
            latitude: row.latitude,
            longitude: row.longitude,
            timezoneOlson: row.timezoneOlson,
            countryIso: row.countryIso,
          },
          create: {
            portName: row.portName,
            locode: row.locode,
            latitude: row.latitude,
            longitude: row.longitude,
            timezoneOlson: row.timezoneOlson,
            countryIso: row.countryIso,
          },
        });
        count++;
      } catch (err) {
        this.logger.error(
          `Failed to upsert locode=${row.locode}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    return count;
  }
}
