"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (term: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = "搜索评论...",
}: SearchBarProps) {
  const [value, setValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    (term: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearch(term);
      }, 300);
    },
    [onSearch],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setValue(term);
    debouncedSearch(term);
  };

  const handleClear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setValue("");
    onSearch("");
  };

  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-sm bg-card text-foreground
          border border-border rounded-sm
          placeholder:text-muted/60
          focus:outline-2 focus:outline-offset-0 focus:outline-accent/40
          transition-colors duration-200"
        aria-label={placeholder}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground
            transition-colors duration-200
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="清除搜索"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
