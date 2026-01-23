'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface BottomNavContextType {
  isVisible: boolean;
  hide: () => void;
  show: () => void;
  // 顶部导航控制
  isTopNavVisible: boolean;
  hideTopNav: () => void;
  showTopNav: () => void;
  // 同时控制两个导航
  hideAll: () => void;
  showAll: () => void;
}

const BottomNavContext = createContext<BottomNavContextType | undefined>(undefined);

export function BottomNavProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isTopNavVisible, setIsTopNavVisible] = useState(true);

  const hide = useCallback(() => setIsVisible(false), []);
  const show = useCallback(() => setIsVisible(true), []);
  const hideTopNav = useCallback(() => setIsTopNavVisible(false), []);
  const showTopNav = useCallback(() => setIsTopNavVisible(true), []);

  const hideAll = useCallback(() => {
    setIsVisible(false);
    setIsTopNavVisible(false);
  }, []);

  const showAll = useCallback(() => {
    setIsVisible(true);
    setIsTopNavVisible(true);
  }, []);

  return (
    <BottomNavContext.Provider value={{
      isVisible, hide, show,
      isTopNavVisible, hideTopNav, showTopNav,
      hideAll, showAll
    }}>
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
