'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface SearchLimit {
  limit: number;
  used: number;
  remaining: number;
  subscription: string;
}

interface SearchLimitContextType {
  searchLimit: SearchLimit | null;
  updateSearchLimit: (limit: SearchLimit) => void;
}

const SearchLimitContext = createContext<SearchLimitContextType | undefined>(undefined);

export function SearchLimitProvider({ children }: { children: ReactNode }) {
  const [searchLimit, setSearchLimit] = useState<SearchLimit | null>(null);

  const updateSearchLimit = useCallback((limit: SearchLimit) => {
    setSearchLimit(limit);
  }, []);

  return (
    <SearchLimitContext.Provider value={{ searchLimit, updateSearchLimit }}>
      {children}
    </SearchLimitContext.Provider>
  );
}

export function useSearchLimit() {
  const context = useContext(SearchLimitContext);
  if (context === undefined) {
    throw new Error('useSearchLimit must be used within a SearchLimitProvider');
  }
  return context;
} 