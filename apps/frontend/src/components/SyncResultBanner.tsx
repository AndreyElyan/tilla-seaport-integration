import type { SyncResult } from "../graphql/types";

interface SyncResultBannerProps {
  result: SyncResult;
  onDismiss: () => void;
}

export function SyncResultBanner({ result, onDismiss }: SyncResultBannerProps) {
  const hasErrors = result.invalidRows > 0;

  return (
    <div className={`banner ${hasErrors ? "banner--warning" : "banner--success"}`}>
      <div className="banner-content">
        <div className="banner-summary">
          <strong>Sync completed in {(result.duration / 1000).toFixed(1)}s</strong>
          <span className="banner-divider">|</span>
          <span>{result.upsertedRows} upserted</span>
          <span className="banner-divider">|</span>
          <span>{result.validRows} valid</span>
          {hasErrors && (
            <>
              <span className="banner-divider">|</span>
              <span className="banner-highlight--warning">
                {result.invalidRows} invalid
              </span>
            </>
          )}
        </div>
        {hasErrors && result.errors.length > 0 && (
          <details className="banner-details">
            <summary>
              Show {result.errors.length} error
              {result.errors.length !== 1 && "s"}
            </summary>
            <ul className="banner-error-list">
              {result.errors.slice(0, 10).map((err) => (
                <li key={err.rowIndex}>
                  Row {err.rowIndex}: {err.reasons.join(", ")}
                </li>
              ))}
              {result.errors.length > 10 && (
                <li className="banner-error-more">
                  ...and {result.errors.length - 10} more
                </li>
              )}
            </ul>
          </details>
        )}
      </div>
      <button className="banner-dismiss" onClick={onDismiss}>
        &#10005;
      </button>
    </div>
  );
}
