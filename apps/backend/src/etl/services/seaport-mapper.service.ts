import { Injectable, Logger } from "@nestjs/common";
import type { MappedSeaportRow, RawExcelRow } from "../dto/seaport-row.dto";

type SeaportField = keyof MappedSeaportRow;

const COLUMN_MAP: Record<string, SeaportField> = {
  "port name": "portName",
  locode: "locode",
  latitude: "latitude",
  longitude: "longitude",
  "timezone olson": "timezoneOlson",
  "country iso": "countryIso",
};

const FIELD_ALIASES: Record<string, SeaportField> = {
  port_name: "portName",
  portname: "portName",
  name: "portName",
  "un/locode": "locode",
  unlocode: "locode",
  un_locode: "locode",
  code: "locode",
  lat: "latitude",
  "lat.": "latitude",
  lng: "longitude",
  lon: "longitude",
  long: "longitude",
  "long.": "longitude",
  timezone: "timezoneOlson",
  tz: "timezoneOlson",
  tz_olson: "timezoneOlson",
  olson: "timezoneOlson",
  country: "countryIso",
  country_iso: "countryIso",
  countrycode: "countryIso",
  country_code: "countryIso",
  "country code": "countryIso",
};

function buildColumnMap(headers: string[]): Map<string, SeaportField> {
  const map = new Map<string, SeaportField>();

  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    const field = COLUMN_MAP[normalized] ?? FIELD_ALIASES[normalized];

    if (field) {
      map.set(header, field);
    }
  }

  return map;
}

@Injectable()
export class SeaportMapperService {
  private readonly logger = new Logger(SeaportMapperService.name);

  mapRows(rows: RawExcelRow[]): MappedSeaportRow[] {
    if (rows.length === 0) {
      this.logger.warn("No rows to map.");
      return [];
    }

    const headers = Object.keys(rows[0]);
    const columnMap = buildColumnMap(headers);

    this.logger.log(
      `Column mapping resolved: ${JSON.stringify(Object.fromEntries(columnMap))}`,
    );

    const unmapped = headers.filter((h) => !columnMap.has(h));
    if (unmapped.length > 0) {
      this.logger.warn(`Unmapped headers ignored: [${unmapped.join(", ")}]`);
    }

    return rows.map((row) => {
      const mapped: MappedSeaportRow = {
        portName: undefined,
        locode: undefined,
        latitude: undefined,
        longitude: undefined,
        timezoneOlson: undefined,
        countryIso: undefined,
      };

      for (const [header, field] of columnMap) {
        const value = row[header];

        if (field === "latitude" || field === "longitude") {
          mapped[field] =
            typeof value === "number" ? value : parseFloat(String(value));
        } else {
          mapped[field] = value != null ? String(value).trim() : undefined;
        }
      }

      return mapped;
    });
  }
}
