import { useMutation } from "@apollo/client/react";
import { SYNC_SEAPORTS } from "../graphql/queries";
import type { SyncResult } from "../graphql/types";

interface SyncButtonProps {
  onComplete: (result: SyncResult) => void;
}

export function SyncButton({ onComplete }: SyncButtonProps) {
  const [syncSeaports, { loading, data, error }] = useMutation<{
    syncSeaports: SyncResult;
  }>(SYNC_SEAPORTS, {
    onCompleted: (res) => onComplete(res.syncSeaports),
  });

  const result = data?.syncSeaports;

  return (
    <div className="sync-card">
      <div className="sync-header">
        <h2 className="sync-title">Sync Seaports</h2>
        <p className="sync-desc">
          Import seaport data from Azure Blob Storage Excel files.
        </p>
      </div>

      <button
        type="button"
        className="sync-btn"
        disabled={loading}
        onClick={() => syncSeaports()}
      >
        {loading ? (
          <>
            <span className="sync-spinner" />
            Syncing...
          </>
        ) : (
          "Run Sync"
        )}
      </button>

      {error && (
        <div className="sync-result sync-result--error">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {result && (
        <div className="sync-result sync-result--success">
          <div className="sync-stats">
            <div className="sync-stat">
              <span className="sync-stat-value">{result.totalRows}</span>
              <span className="sync-stat-label">Total Rows</span>
            </div>
            <div className="sync-stat">
              <span className="sync-stat-value sync-stat-value--success">
                {result.validRows}
              </span>
              <span className="sync-stat-label">Valid</span>
            </div>
            <div className="sync-stat">
              <span className="sync-stat-value sync-stat-value--warning">
                {result.invalidRows}
              </span>
              <span className="sync-stat-label">Invalid</span>
            </div>
            <div className="sync-stat">
              <span className="sync-stat-value sync-stat-value--primary">
                {result.upsertedRows}
              </span>
              <span className="sync-stat-label">Upserted</span>
            </div>
            <div className="sync-stat">
              <span className="sync-stat-value">
                {(result.duration / 1000).toFixed(1)}s
              </span>
              <span className="sync-stat-label">Duration</span>
            </div>
          </div>
          {result.errors.length > 0 && (
            <details className="sync-errors">
              <summary>
                {result.errors.length} row{" "}
                {result.errors.length === 1 ? "error" : "errors"}
              </summary>
              <ul className="sync-error-list">
                {result.errors.slice(0, 20).map((err) => (
                  <li key={err.rowIndex}>
                    <strong>Row {err.rowIndex}:</strong>{" "}
                    {err.reasons.join(", ")}
                  </li>
                ))}
                {result.errors.length > 20 && (
                  <li className="sync-error-more">
                    ...and {result.errors.length - 20} more
                  </li>
                )}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
