export interface RawExcelRow {
  [key: string]: unknown;
}

export interface MappedSeaportRow {
  portName: string | undefined;
  locode: string | undefined;
  latitude: number | undefined;
  longitude: number | undefined;
  timezoneOlson: string | undefined;
  countryIso: string | undefined;
}

export interface ValidatedSeaportRow {
  portName: string;
  locode: string;
  latitude: number;
  longitude: number;
  timezoneOlson: string | null;
  countryIso: string | null;
}

export interface ValidationResult {
  valid: ValidatedSeaportRow[];
  invalid: {
    row: MappedSeaportRow;
    reasons: string[];
    rowIndex: number;
  }[];
}

export interface SyncResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  upsertedRows: number;
  errors: {
    rowIndex: number;
    reasons: string[];
  }[];
  duration: number;
}
