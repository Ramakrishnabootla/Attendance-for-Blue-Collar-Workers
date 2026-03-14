import React, { useState, useEffect } from 'react';
import { searchWorkers } from '../utils/api';
import './SearchBar.css';

export default function SearchBar({ onSearch, placeholder = 'Search workers...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        performSearch();
      } else {
        setResults([]);
        setShowResults(false);
        if (onSearch) onSearch(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async () => {
    try {
      setIsSearching(true);
      const data = await searchWorkers(query);
      if (data.success) {
        setResults(data.workers);
        setShowResults(true);
        if (onSearch) onSearch(data.workers);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (worker) => {
    setQuery('');
    setShowResults(false);
    setResults([]);
    if (onSearch) onSearch([worker]);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    if (onSearch) onSearch(null);
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar-input-wrapper">
        <input
          type="text"
          className="search-bar-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
        />
        {query && (
          <button className="search-bar-clear" onClick={handleClear}>
            ✕
          </button>
        )}
        {isSearching && <span className="search-bar-spinner"></span>}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-bar-results">
          {results.map((worker) => (
            <div
              key={worker.id}
              className="search-bar-result-item"
              onClick={() => handleResultClick(worker)}
            >
              <strong>{worker.worker_id}</strong> - {worker.name}
              <span className="search-bar-job-type">{worker.job_type}</span>
            </div>
          ))}
        </div>
      )}

      {showResults && query && results.length === 0 && !isSearching && (
        <div className="search-bar-no-results">
          No workers found
        </div>
      )}
    </div>
  );
}
