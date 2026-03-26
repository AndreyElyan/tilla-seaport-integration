import { useQuery } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { SeaportSearch } from "../components/SeaportSearch";
import { SeaportTable } from "../components/SeaportTable";
import { SyncResultBanner } from "../components/SyncResultBanner";
import { GET_SEAPORTS } from "../graphql/queries";
import type { SeaportPage, SyncResult } from "../graphql/types";

const PAGE_SIZE = 20;

export function SeaportsPage() {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const searchTerm =
    countryFilter && search
      ? `${search} ${countryFilter}`
      : countryFilter || search;

  const { data, loading, refetch } = useQuery<{ seaports: SeaportPage }>(
    GET_SEAPORTS,
    {
      variables: { page, pageSize: PAGE_SIZE, search: searchTerm || undefined },
      fetchPolicy: "cache-and-network",
    },
  );

  const seaportPage = data?.seaports;

  const handleSearch = useCallback(
    (query: string) => {
      setSearch(query);
      setPage(1);
    },
    [],
  );

  const handleCountryFilter = useCallback(
    (iso: string) => {
      setCountryFilter(iso);
      setPage(1);
    },
    [],
  );

  const handleSyncComplete = useCallback(
    (result: SyncResult) => {
      setSyncResult(result);
      refetch();
    },
    [refetch],
  );

  const handleDismissBanner = useCallback(() => {
    setSyncResult(null);
  }, []);

  return (
    <div>
      {syncResult && (
        <SyncResultBanner result={syncResult} onDismiss={handleDismissBanner} />
      )}

      <SeaportSearch
        onSearch={handleSearch}
        onCountryFilter={handleCountryFilter}
        total={seaportPage?.total ?? 0}
      />

      <SeaportTable
        seaports={seaportPage?.items ?? []}
        loading={loading && !data}
      />

      {seaportPage && seaportPage.totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {seaportPage.page} of {seaportPage.totalPages}
          </span>
          <button
            className="pagination-btn"
            disabled={page >= seaportPage.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
