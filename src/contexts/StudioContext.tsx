'use client';

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';

interface StudioContextType {
  title: string;
  setTitle: (title: string) => void;
  /** 打开每日任务模态框 */
  openDailyTasks: () => void;
  /** 设置打开每日任务的回调（供 layout 使用） */
  setDailyTasksCallback: (callback: () => void) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('Studio');
  const [dailyTasksCallback, setDailyTasksCallbackState] = useState<(() => void) | null>(null);

  const openDailyTasks = useCallback(() => {
    if (dailyTasksCallback) {
      dailyTasksCallback();
    }
  }, [dailyTasksCallback]);

  const setDailyTasksCallback = useCallback((callback: () => void) => {
    setDailyTasksCallbackState(() => callback);
  }, []);

  const value = useMemo(() => ({
    title,
    setTitle,
    openDailyTasks,
    setDailyTasksCallback,
  }), [title, openDailyTasks, setDailyTasksCallback]);

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