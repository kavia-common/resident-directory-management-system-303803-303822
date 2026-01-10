import React from 'react';

// PUBLIC_INTERFACE
export function SearchBar({
  qValue,
  buildingValue,
  unitValue,
  onChangeQ,
  onChangeBuilding,
  onChangeUnit,
  onSubmit,
  onClear,
  qPlaceholder = 'Search by name…',
}) {
  /** Search/filter bar for the directory: q + building + unit, plus Search/Clear actions. */
  const canClear = Boolean(qValue || buildingValue || unitValue);

  return (
    <form
      className="searchbar"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <div>
        <label className="sr-only" htmlFor="directory-q">
          Search residents by name
        </label>
        <input
          id="directory-q"
          className="input"
          value={qValue}
          onChange={(e) => onChangeQ?.(e.target.value)}
          placeholder={qPlaceholder}
          type="search"
          autoComplete="off"
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="directory-building">
          Filter by building
        </label>
        <input
          id="directory-building"
          className="input"
          value={buildingValue}
          onChange={(e) => onChangeBuilding?.(e.target.value)}
          placeholder="Building"
          type="text"
          autoComplete="off"
        />
      </div>

      <div>
        <label className="sr-only" htmlFor="directory-unit">
          Filter by unit
        </label>
        <input
          id="directory-unit"
          className="input"
          value={unitValue}
          onChange={(e) => onChangeUnit?.(e.target.value)}
          placeholder="Unit"
          type="text"
          inputMode="text"
          autoComplete="off"
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" type="submit">
          Search
        </button>
        <button className="btn btn-secondary" type="button" onClick={() => onClear?.()} disabled={!canClear}>
          Clear
        </button>
      </div>
    </form>
  );
}
