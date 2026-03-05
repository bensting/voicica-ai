'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BINANCE_WS_URL, BINANCE_KLINES_URL, WS_RECONNECT_DELAY_MS, PRICE_CHART_HISTORY_SECONDS } from '@/config/native/bullBearConfig';

export interface PriceTick {
  price: number;
  time: number; // Unix seconds (for lightweight-charts)
}

interface UseBtcPriceResult {
  price: number | null;
  priceHistory: PriceTick[];
  isConnected: boolean;
}

/**
 * Binance WebSocket hook for real-time BTC/USDT price
 *
 * - 启动时从 REST API 预加载历史 1s K 线，图表立即有数据
 * - 逐笔交易聚合为 1 秒 K 线（取每秒最后一笔价格）
 * - 保留最近 PRICE_CHART_HISTORY_SECONDS 秒
 * - 自动重连，unmount 时关闭
 */
export function useBtcPrice(): UseBtcPriceResult {
  const [price, setPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceTick[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mountedRef = useRef(true);

  // 1-second aggregation: keep a map of { unixSecond → lastPrice }
  const candleMapRef = useRef<Map<number, number>>(new Map());
  const latestPriceRef = useRef<number>(0);
  const flushTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  /** Fetch historical 1s klines from Binance REST API */
  const loadHistory = useCallback(async () => {
    try {
      const endTime = Date.now();
      const startTime = endTime - PRICE_CHART_HISTORY_SECONDS * 1000;
      const url = `${BINANCE_KLINES_URL}?symbol=BTCUSDT&interval=1s&startTime=${startTime}&endTime=${endTime}&limit=${PRICE_CHART_HISTORY_SECONDS}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      // Kline format: [openTime, open, high, low, close, volume, closeTime, ...]
      const map = candleMapRef.current;
      for (const k of data) {
        const sec = Math.floor(k[0] / 1000); // openTime ms → seconds
        const closePrice = parseFloat(k[4]);
        if (!isNaN(closePrice) && !map.has(sec)) {
          map.set(sec, closePrice);
        }
      }
      // Set initial price from last kline
      if (data.length > 0) {
        const lastClose = parseFloat(data[data.length - 1][4]);
        if (!isNaN(lastClose) && !latestPriceRef.current) {
          latestPriceRef.current = lastClose;
        }
      }
    } catch {
      // ignore — WebSocket will fill in data
    }
  }, []);

  /** Flush candle map → sorted array, trim old entries, push to React state */
  const flush = useCallback(() => {
    if (!mountedRef.current) return;
    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - PRICE_CHART_HISTORY_SECONDS;
    const map = candleMapRef.current;

    // Remove old entries
    for (const key of map.keys()) {
      if (key < cutoff) map.delete(key);
    }

    // Convert to sorted array
    const arr: PriceTick[] = [];
    const sortedKeys = [...map.keys()].sort((a, b) => a - b);
    for (const sec of sortedKeys) {
      arr.push({ time: sec, price: map.get(sec)! });
    }

    setPrice(latestPriceRef.current || null);
    setPriceHistory(arr);
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    try {
      const ws = new WebSocket(BINANCE_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          const newPrice = parseFloat(data.p);
          if (isNaN(newPrice)) return;

          latestPriceRef.current = newPrice;

          // Aggregate into 1-second buckets
          const sec = Math.floor(Date.now() / 1000);
          candleMapRef.current.set(sec, newPrice);
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        if (mountedRef.current) {
          setIsConnected(false);
          reconnectTimerRef.current = setTimeout(connect, WS_RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      reconnectTimerRef.current = setTimeout(connect, WS_RECONNECT_DELAY_MS);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Load historical klines first, then connect WebSocket
    loadHistory().then(() => {
      if (mountedRef.current) {
        flush(); // Immediately render historical data
        connect();
      }
    });

    // Flush aggregated data to React state every 500ms
    flushTimerRef.current = setInterval(flush, 500);

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, flush, loadHistory]);

  return { price, priceHistory, isConnected };
}
