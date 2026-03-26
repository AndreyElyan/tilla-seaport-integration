import { useQuery } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { SeaportSearch } from "../components/SeaportSearch";
import {
  SeaportTable,
  type SortDir,
  type SortField,
} from "../components/SeaportTable";
import { GET_SEAPORTS } from "../graphql/queries";
import type { SeaportPage } from "../graphql/types";

const PAGE_SIZE = 20;

export function SeaportsPage() {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("portName");
  const [sortDirection, setSortDirection] = useState<SortDir>("asc");

  const { data, loading, error, refetch } = useQuery<{
    seaports: SeaportPage;
  }>(GET_SEAPORTS, {
    variables: {
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      countryIso: countryFilter || undefined,
      sortBy,
      sortDirection,
    },
    fetchPolicy: "cache-and-network",
  });

  const seaportPage = data?.seaports;

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    setPage(1);
  }, []);

  const handleCountryFilter = useCallback((iso: string) => {
    setCountryFilter(iso);
    setPage(1);
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortBy) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortDirection("asc");
      }
      setPage(1);
    },
    [sortBy],
  );

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Seaports</h2>
      </div>

      {error && (
        <div className="error-banner">
          <span>Failed to load seaports: {error.message}</span>
          <button
            type="button"
            className="error-retry-btn"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      )}

      <SeaportSearch
        onSearch={handleSearch}
        onCountryFilter={handleCountryFilter}
        total={seaportPage?.total ?? 0}
      />

      <SeaportTable
        seaports={seaportPage?.items ?? []}
        loading={loading && !data}
        fetching={loading && !!data}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      {seaportPage && seaportPage.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
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
            type="button"
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
