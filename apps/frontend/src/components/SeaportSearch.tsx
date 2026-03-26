import { useEffect, useState } from "react";

interface SeaportSearchProps {
  onSearch: (query: string) => void;
  onCountryFilter: (countryIso: string) => void;
  total: number;
}

export function SeaportSearch({
  onSearch,
  onCountryFilter,
  total,
}: SeaportSearchProps) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(query.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, onSearch]);

  useEffect(() => {
    onCountryFilter(country.trim().toUpperCase());
  }, [country, onCountryFilter]);

  const hasFilters = query.length > 0 || country.length > 0;

  const handleClear = () => {
    setQuery("");
    setCountry("");
  };

  return (
    <div className="search-bar">
      <div className="search-inputs">
        <div className="search-field">
          <label className="search-label" htmlFor="search">
            Search
          </label>
          <div className="search-input-wrap">
            <input
              id="search"
              className="search-input"
              type="text"
              placeholder="Port name or LOCODE..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setQuery("")}
              >
                &#10005;
              </button>
            )}
          </div>
        </div>
        <div className="search-field search-field--small">
          <label className="search-label" htmlFor="country">
            Country
          </label>
          <input
            id="country"
            className="search-input"
            type="text"
            placeholder="e.g. BR"
            maxLength={2}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            className="search-clear-all"
            onClick={handleClear}
          >
            Clear filters
          </button>
        )}
      </div>
      <div className="search-total">
        <span className="search-total-num">{total.toLocaleString()}</span>
        <span className="search-total-label">
          {total === 1 ? "port" : "ports"}
        </span>
      </div>
    </div>
  );
}
