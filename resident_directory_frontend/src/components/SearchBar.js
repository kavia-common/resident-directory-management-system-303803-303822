import React from 'react';

// PUBLIC_INTERFACE
export function SearchBar({ value, onChange, onSubmit, placeholder = 'Search by name, address, phone, email…' }) {
  /** Search input with submit button, suitable for resident directory filters. */
  return (
    <form
      className="searchbar"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <label className="sr-only" htmlFor="search-input">
        Search residents
      </label>
      <input
        id="search-input"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="search"
        autoComplete="off"
      />
      <button className="btn" type="submit">
        Search
      </button>
    </form>
  );
}
