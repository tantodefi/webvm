"use client";

import React, { createContext, useContext, useState } from 'react';

interface CheerpXContextType {
  isAvailable: boolean;
  setAvailable: (available: boolean) => void;
  isInitializing: boolean;
  setInitializing: (initializing: boolean) => void;
}

const CheerpXContext = createContext<CheerpXContextType | undefined>(undefined);

export function CheerpXProvider({ children }: { children: React.ReactNode }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const setAvailable = (available: boolean) => {
    setIsAvailable(available);
    if (available || !available) {
      setIsInitializing(false);
    }
  };

  const setInitializing = (initializing: boolean) => {
    setIsInitializing(initializing);
  };

  return (
    <CheerpXContext.Provider value={{ 
      isAvailable, 
      setAvailable, 
      isInitializing, 
      setInitializing 
    }}>
      {children}
    </CheerpXContext.Provider>
  );
}

export function useCheerpX() {
  const context = useContext(CheerpXContext);
  if (context === undefined) {
    throw new Error('useCheerpX must be used within a CheerpXProvider');
  }
  return context;
} 