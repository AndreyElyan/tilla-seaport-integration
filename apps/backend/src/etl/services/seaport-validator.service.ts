import { Injectable, Logger } from "@nestjs/common";
import type {
  MappedSeaportRow,
  ValidatedSeaportRow,
  ValidationResult,
} from "../dto/seaport-row.dto";

const LOCODE_REGEX = /^[A-Z]{2}[A-Z0-9]{3}$/;

const COUNTRY_ISO_REGEX = /^[A-Z]{2}$/;

const VALID_TIMEZONES = new Set(Intl.supportedValuesOf("timeZone"));

@Injectable()
export class SeaportValidatorService {
  private readonly logger = new Logger(SeaportValidatorService.name);

  validate(rows: MappedSeaportRow[]): ValidationResult {
    const valid: ValidatedSeaportRow[] = [];
    const invalid: ValidationResult["invalid"] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const reasons: string[] = [];

      if (!row.portName) {
        reasons.push("portName is required");
      }

      if (!row.locode) {
        reasons.push("locode is required");
      } else if (!LOCODE_REGEX.test(row.locode.toUpperCase())) {
        reasons.push(`locode "${row.locode}" does not match format XX XXX`);
      }

      if (row.latitude == null || Number.isNaN(row.latitude)) {
        reasons.push("latitude is required and must be a number");
      } else if (row.latitude < -90 || row.latitude > 90) {
        reasons.push(`latitude ${row.latitude} out of range [-90, 90]`);
      }

      if (row.longitude == null || Number.isNaN(row.longitude)) {
        reasons.push("longitude is required and must be a number");
      } else if (row.longitude < -180 || row.longitude > 180) {
        reasons.push(`longitude ${row.longitude} out of range [-180, 180]`);
      }

      if (row.timezoneOlson && !VALID_TIMEZONES.has(row.timezoneOlson)) {
        reasons.push(
          `timezone "${row.timezoneOlson}" is not a valid IANA timezone`,
        );
      }

      if (
        row.countryIso &&
        !COUNTRY_ISO_REGEX.test(row.countryIso.toUpperCase())
      ) {
        reasons.push(
          `countryIso "${row.countryIso}" does not match ISO 3166-1 alpha-2`,
        );
      }

      if (reasons.length > 0) {
        invalid.push({ row, reasons, rowIndex: i + 2 });
      } else {
        valid.push({
          portName: row.portName as string,
          locode: (row.locode as string).toUpperCase(),
          latitude: row.latitude as number,
          longitude: row.longitude as number,
          timezoneOlson: row.timezoneOlson ?? null,
          countryIso: row.countryIso?.toUpperCase() ?? null,
        });
      }
    }

    this.logger.log(
      `Validation complete: ${valid.length} valid, ${invalid.length} invalid out of ${rows.length} rows`,
    );

    if (invalid.length > 0) {
      this.logger.warn(
        `First invalid row (index ${invalid[0].rowIndex}): ${invalid[0].reasons.join("; ")}`,
      );
    }

    return { valid, invalid };
  }
}
