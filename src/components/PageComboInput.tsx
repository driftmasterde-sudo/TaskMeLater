'use client';

import { useState, useRef, useEffect } from 'react';

interface PageComboInputProps {
  pages: string[];
  value: string;
  onChange: (value: string) => void;
  onAddPage?: (page: string) => void;
  className?: string;
  placeholder?: string;
}

export function PageComboInput({ pages, value, onChange, onAddPage, className = '', placeholder = 'Select or type a page name...' }: PageComboInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // If user typed something new, commit it
        if (inputValue.trim() && inputValue.trim() !== value) {
          commitValue(inputValue.trim());
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, value]);

  const filteredPages = pages.filter((p) =>
    p.toLowerCase().includes(inputValue.toLowerCase())
  );

  const isNewPage = inputValue.trim() !== '' && !pages.some((p) => p.toLowerCase() === inputValue.trim().toLowerCase());

  function commitValue(val: string) {
    if (!val) return;
    if (isNewPage && onAddPage) {
      onAddPage(val);
    }
    onChange(val);
    setIsOpen(false);
  }

  function handleSelect(page: string) {
    setInputValue(page);
    onChange(page);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitValue(inputValue.trim());
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue(value);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {isOpen && (filteredPages.length > 0 || isNewPage) && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg bg-card border border-card-border shadow-lg">
          {filteredPages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => handleSelect(page)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted-bg cursor-pointer ${
                page === value ? 'text-accent font-medium' : 'text-foreground'
              }`}
            >
              {page}
            </button>
          ))}
          {isNewPage && (
            <button
              type="button"
              onClick={() => commitValue(inputValue.trim())}
              className="w-full text-left px-3 py-2 text-sm text-accent font-medium hover:bg-muted-bg border-t border-card-border cursor-pointer"
            >
              + Create &quot;{inputValue.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
