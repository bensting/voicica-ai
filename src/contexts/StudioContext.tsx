'use client';

import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface StudioContextType {
  title: string;
  setTitle: (title: string) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('Studio');

  const value = useMemo(() => ({ title, setTitle }), [title]);

  return (
    <StudioContext.Provider value={value}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}