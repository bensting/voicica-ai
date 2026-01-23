'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface BottomNavContextType {
  isVisible: boolean;
  hide: () => void;
  show: () => void;
}

const BottomNavContext = createContext<BottomNavContextType | undefined>(undefined);

export function BottomNavProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);

  const hide = useCallback(() => setIsVisible(false), []);
  const show = useCallback(() => setIsVisible(true), []);

  return (
    <BottomNavContext.Provider value={{ isVisible, hide, show }}>
      {children}
    </BottomNavContext.Provider>
  );
}

export function useBottomNav() {
  const context = useContext(BottomNavContext);
  if (context === undefined) {
    throw new Error('useBottomNav must be used within a BottomNavProvider');
  }
  return context;
}
