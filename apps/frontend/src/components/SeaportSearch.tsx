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

  return (
    <div className="search-bar">
      <div className="search-inputs">
        <div className="search-field">
          <label className="search-label" htmlFor="search">
            Search
          </label>
          <input
            id="search"
            className="search-input"
            type="text"
            placeholder="Port name or LOCODE..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
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
      </div>
      <span className="search-count">
        {total.toLocaleString()} {total === 1 ? "port" : "ports"}
      </span>
    </div>
  );
}
