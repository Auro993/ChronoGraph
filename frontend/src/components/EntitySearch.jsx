import React, { useState, useEffect, useRef } from 'react';
import '../styles/EntitySearch.css';

const EntitySearch = ({ onSelect, placeholder = "Search entities..." }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (value) => {
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(value)}`);
      const data = await response.json();
      if (data.status === 'success') {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    fetchSuggestions(value);
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      if (onSelect) {
        onSelect(query);
      }
    }
  };

  return (
    <div className="entity-search" ref={wrapperRef}>
      <form onSubmit={handleSubmit}>
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="search-input"
          />
          {loading && <span className="search-loading">...</span>}
        </div>
      </form>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => handleSelect(suggestion)}
            >
              <span className="suggestion-icon">📌</span>
              <span className="suggestion-text">{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntitySearch;