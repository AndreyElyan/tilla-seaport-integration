import { Module } from "@nestjs/common";
import { EtlResolver } from "./etl.resolver";
import { BlobStorageService } from "./services/blob-storage.service";
import { ExcelParserService } from "./services/excel-parser.service";
import { SeaportMapperService } from "./services/seaport-mapper.service";
import { SeaportSyncService } from "./services/seaport-sync.service";
import { SeaportValidatorService } from "./services/seaport-validator.service";

@Module({
  providers: [
    BlobStorageService,
    ExcelParserService,
    SeaportMapperService,
    SeaportValidatorService,
    SeaportSyncService,
    EtlResolver,
  ],
})
export class EtlModule {}
