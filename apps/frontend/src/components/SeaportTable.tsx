import type { Seaport } from "../graphql/types";

interface SeaportTableProps {
  seaports: Seaport[];
  loading: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SeaportTable({ seaports, loading }: SeaportTableProps) {
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
            <th>Port Name</th>
            <th>LOCODE</th>
            <th>Country</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Timezone</th>
            <th>Updated</th>
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
              <td className="table-cell--muted">{port.timezoneOlson ?? "-"}</td>
              <td className="table-cell--muted">
                {formatDate(port.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
