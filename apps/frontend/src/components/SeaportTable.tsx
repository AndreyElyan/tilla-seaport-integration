import type { Seaport } from "../graphql/types";

interface SeaportTableProps {
  seaports: Seaport[];
  loading: boolean;
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
                {port.timezoneOlson ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
