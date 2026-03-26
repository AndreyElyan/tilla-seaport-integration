export interface Seaport {
  id: number;
  portName: string;
  locode: string;
  latitude: number;
  longitude: number;
  timezoneOlson: string | null;
  countryIso: string | null;
  clientSource: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeaportPage {
  items: Seaport[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SyncError {
  rowIndex: number;
  reasons: string[];
}

export interface SyncResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  upsertedRows: number;
  errors: SyncError[];
  duration: number;
}
