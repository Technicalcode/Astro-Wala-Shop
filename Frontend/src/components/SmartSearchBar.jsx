import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useSelector } from "react-redux";
import { searchProductsSelector } from "../store/productsSlice";
import Editable from "./editable/Editable";

export default function SmartSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const allResults = useSelector(searchProductsSelector(query));
  const suggestions = query.trim().length > 1 ? allResults.slice(0, 6) : [];

  // Open dropdown if we have suggestions
  useEffect(() => {
    if (query.trim().length > 1) {
      setOpen(suggestions.length > 0);
    } else {
      setOpen(false);
    }
  }, [query, suggestions.length]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
      if (e.key === "Enter" && query.trim()) {
        setOpen(false);
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    },
    [query, navigate]
  );

  const handleSuggestionClick = (product) => {
    setOpen(false);
    setQuery("");
    navigate(`/product/${product.id}`);
  };

  const handleViewAll = () => {
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <Editable
      as="div"
      kind="button"
      id="navbar-search-container"
      label="Search Bar Container"
      className="relative"
      ref={containerRef}
    >
      {/* Input row */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-md focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30 transition-all w-full min-w-[220px] md:min-w-[300px]">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          placeholder="Search products, brands…"
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          aria-label="Search"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
          <ul role="listbox">
            {suggestions.map((product) => (
              <li key={product.id} role="option">
                <Editable
                  as="button"
                  group="search-suggestion"
                  label="Search Suggestion"
                  kind="button"
                  onClick={() => handleSuggestionClick(product)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                >
                  {/* Thumbnail */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-8 h-8 rounded object-cover shrink-0 border border-gray-100"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src =
                        "https://placehold.co/32x32/1A4B8C/FFFFFF?text=P";
                    }}
                  />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate font-medium">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {product.brand}
                    </p>
                  </div>
                  {/* Price */}
                  <span className="text-sm font-semibold text-gray-900 shrink-0">
                    ₹{product.price?.toLocaleString("en-IN")}
                  </span>
                </Editable>
              </li>
            ))}
          </ul>

          {/* View all results */}
          {query.trim().length > 1 && (
            <button
              onClick={handleViewAll}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-brand font-medium border-t border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <Search size={13} />
              View all results for &quot;{query.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </Editable>
  );
}
