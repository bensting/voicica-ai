'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FAKE_PLAYER_NAMES, LIVE_FEED_CONFIG } from '@/config/native/crashGameConfig';

interface FeedEntry {
  id: number;
  name: string;
  bet: number;
  multiplier: number;
  isWin: boolean;
}

/**
 * 滚动假数据 LiveFeed - 纯客户端生成
 */
export default function LiveFeed() {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const counterRef = useRef(0);

  const generateEntry = useCallback((): FeedEntry => {
    const { betRange, multiplierRange, winRate } = LIVE_FEED_CONFIG;
    const name = FAKE_PLAYER_NAMES[Math.floor(Math.random() * FAKE_PLAYER_NAMES.length)];
    const bet = Math.floor(Math.random() * (betRange.max - betRange.min) + betRange.min);
    const isWin = Math.random() < winRate;
    const multiplier = isWin
      ? Math.floor((1 + Math.random() * (multiplierRange.max - 1)) * 100) / 100
      : Math.floor((1 + Math.random() * 0.5) * 100) / 100;

    return {
      id: counterRef.current++,
      name,
      bet,
      multiplier,
      isWin,
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Initial batch
    setEntries(Array.from({ length: 5 }, () => generateEntry()));

    const interval = setInterval(() => {
      setEntries(prev => {
        const newEntry = generateEntry();
        const updated = [newEntry, ...prev];
        return updated.slice(0, LIVE_FEED_CONFIG.maxEntries);
      });
    }, LIVE_FEED_CONFIG.intervalMs);

    return () => clearInterval(interval);
  }, [isOpen, generateEntry]);

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-white/50 hover:text-white/70 transition-colors"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        Live
      </button>

      {/* Feed panel */}
      {isOpen && (
        <div className="absolute top-12 right-0 z-20 w-56 max-h-64 overflow-y-auto rounded-xl bg-black/80 backdrop-blur-lg border border-white/10 p-2 shadow-xl">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between py-1.5 px-2 text-xs border-b border-white/5 last:border-0 animate-fadeIn"
            >
              <span className="text-white/60 truncate w-16">{entry.name}</span>
              <span className="text-white/40">${entry.bet}</span>
              <span className={`font-medium ${entry.isWin ? 'text-green-400' : 'text-red-400'}`}>
                {entry.multiplier.toFixed(2)}x
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
