import { Injectable, Logger } from "@nestjs/common";
import { resolveCountryIso } from "../data/country-lookup";
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
  "port locode": "locode",
  "port code": "locode",
  portcode: "locode",
  "un/locode": "locode",
  "un locode": "locode",
  unlocode: "locode",
  unloccode: "locode",
  un_locode: "locode",
  code: "locode",
  lat: "latitude",
  "lat.": "latitude",
  lng: "longitude",
  lon: "longitude",
  long: "longitude",
  "long.": "longitude",
  timezone: "timezoneOlson",
  "timezone olson": "timezoneOlson",
  apptimezone: "timezoneOlson",
  tz: "timezoneOlson",
  tz_olson: "timezoneOlson",
  olson: "timezoneOlson",
  country: "countryIso",
  country_iso: "countryIso",
  countrycode: "countryIso",
  country_code: "countryIso",
  "country code": "countryIso",
};

const DMS_LAT_COLUMNS = {
  degree: ["latdegree", "lat_degree", "lat degree"],
  minutes: ["latminutes", "lat_minutes", "lat minutes"],
  direction: ["latdirection", "lat_direction", "lat direction"],
};

const DMS_LON_COLUMNS = {
  degree: ["londegree", "lon_degree", "lon degree", "longdegree"],
  minutes: ["lonminutes", "lon_minutes", "lon minutes", "longminutes"],
  direction: [
    "londirection",
    "lon_direction",
    "lon direction",
    "longdirection",
  ],
};

function findDmsValue(
  row: RawExcelRow,
  aliases: string[],
): number | string | undefined {
  for (const alias of aliases) {
    const val = row[alias];
    if (val != null) return typeof val === "number" ? val : String(val).trim();
  }
  return undefined;
}

function dmsToDecimal(
  degree: number | string | undefined,
  minutes: number | string | undefined,
  direction: number | string | undefined,
): number | undefined {
  const deg = Number(degree);
  const min = Number(minutes ?? 0);
  if (Number.isNaN(deg)) return undefined;

  let decimal = deg + min / 60;
  const dir = String(direction ?? "").toUpperCase();
  if (dir === "S" || dir === "W") {
    decimal = -decimal;
  }

  return decimal;
}

function sanitizePortName(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/\s*\{[^}]*\}\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

    const allHeaders = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        allHeaders.add(key);
      }
    }
    const headers = [...allHeaders];

    this.logger.log(`Discovered headers: [${headers.join(", ")}]`);

    const columnMap = buildColumnMap(headers);

    this.logger.log(
      `Column mapping resolved: ${JSON.stringify(Object.fromEntries(columnMap))}`,
    );

    const unmapped = headers.filter((h) => !columnMap.has(h));
    if (unmapped.length > 0) {
      this.logger.warn(`Unmapped headers ignored: [${unmapped.join(", ")}]`);
    }

    const hasDmsLat = DMS_LAT_COLUMNS.degree.some((a) => allHeaders.has(a));
    const hasDmsLon = DMS_LON_COLUMNS.degree.some((a) => allHeaders.has(a));
    if (hasDmsLat || hasDmsLon) {
      this.logger.log(
        "DMS coordinate columns detected, will convert to decimal",
      );
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
          const num =
            typeof value === "number" ? value : parseFloat(String(value));
          if (!Number.isNaN(num)) {
            mapped[field] = num;
          }
        } else if (field === "countryIso") {
          mapped[field] =
            value != null ? resolveCountryIso(String(value)) : undefined;
        } else if (field === "portName") {
          mapped[field] =
            value != null ? sanitizePortName(String(value)) : undefined;
        } else {
          mapped[field] = value != null ? String(value).trim() : undefined;
        }
      }

      const portcode = row.portcode;
      if (portcode != null) {
        mapped.locode = String(portcode).trim();
      }

      if (mapped.latitude == null && hasDmsLat) {
        mapped.latitude = dmsToDecimal(
          findDmsValue(row, DMS_LAT_COLUMNS.degree),
          findDmsValue(row, DMS_LAT_COLUMNS.minutes),
          findDmsValue(row, DMS_LAT_COLUMNS.direction),
        );
      }

      if (mapped.longitude == null && hasDmsLon) {
        mapped.longitude = dmsToDecimal(
          findDmsValue(row, DMS_LON_COLUMNS.degree),
          findDmsValue(row, DMS_LON_COLUMNS.minutes),
          findDmsValue(row, DMS_LON_COLUMNS.direction),
        );
      }

      return mapped;
    });
  }
}
