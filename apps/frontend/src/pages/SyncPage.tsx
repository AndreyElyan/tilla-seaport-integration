import { useQuery } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { SyncButton } from "../components/SyncButton";
import { SyncResultBanner } from "../components/SyncResultBanner";
import { GET_SEAPORT_COUNT } from "../graphql/queries";
import type { SyncResult } from "../graphql/types";

export function SyncPage() {
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const { data, refetch } = useQuery<{ seaportCount: number }>(
    GET_SEAPORT_COUNT,
    { fetchPolicy: "cache-and-network" },
  );

  const handleComplete = useCallback(
    (result: SyncResult) => {
      setLastResult(result);
      refetch();
    },
    [refetch],
  );

  const handleDismiss = useCallback(() => {
    setLastResult(null);
  }, []);

  return (
    <div>
      {lastResult && (
        <SyncResultBanner result={lastResult} onDismiss={handleDismiss} />
      )}

      <div className="sync-page-header">
        <h2 className="page-title">Data Sync</h2>
        {data && (
          <span className="sync-page-count">
            {data.seaportCount.toLocaleString()} seaports in database
          </span>
        )}
      </div>

      <SyncButton onComplete={handleComplete} />
    </div>
  );
}
