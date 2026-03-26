import type { Seaport } from "../graphql/types";

export type SortField =
  | "portName"
  | "locode"
  | "countryIso"
  | "latitude"
  | "longitude"
  | "updatedAt";
export type SortDir = "asc" | "desc";

interface SeaportTableProps {
  seaports: Seaport[];
  loading: boolean;
  sortBy: SortField;
  sortDirection: SortDir;
  onSort: (field: SortField) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const COLUMNS: { field: SortField; label: string }[] = [
  { field: "portName", label: "Port Name" },
  { field: "locode", label: "LOCODE" },
  { field: "countryIso", label: "Country" },
  { field: "latitude", label: "Latitude" },
  { field: "longitude", label: "Longitude" },
  { field: "updatedAt", label: "Updated" },
];

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDir;
}) {
  if (!active) return <span className="sort-icon sort-icon--inactive" />;
  return (
    <span className="sort-icon sort-icon--active">
      {direction === "asc" ? "\u25B2" : "\u25BC"}
    </span>
  );
}

export function SeaportTable({
  seaports,
  loading,
  sortBy,
  sortDirection,
  onSort,
}: SeaportTableProps) {
  if (loading) {
    return <div className="table-empty">Loading seaports...</div>;
  }

  if (seaports.length === 0) {
    return <div className="table-empty">No seaports found.</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.field}
                className="th-sortable"
                onClick={() => onSort(col.field)}
              >
                {col.label}
                <SortIcon
                  active={sortBy === col.field}
                  direction={sortDirection}
                />
              </th>
            ))}
            <th>Timezone</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {seaports.map((port) => (
            <tr key={port.id}>
              <td className="table-cell--name">{port.portName}</td>
              <td>
                <code className="table-code">{port.locode}</code>
              </td>
              <td>{port.countryIso ?? "-"}</td>
              <td className="table-cell--num">{port.latitude.toFixed(4)}</td>
              <td className="table-cell--num">{port.longitude.toFixed(4)}</td>
              <td className="table-cell--muted">
                {formatDate(port.updatedAt)}
              </td>
              <td className="table-cell--muted">{port.timezoneOlson ?? "-"}</td>
              <td>
                <span className="table-badge">{port.clientSource}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
