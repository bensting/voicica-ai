'use client';

import { useEffect, useRef, useMemo } from 'react';
import { createChart, AreaSeries, type IChartApi, type ISeriesApi, ColorType, type LineData, type Time } from 'lightweight-charts';
import type { PriceTick } from '@/hooks/useBtcPrice';

interface BtcPriceDisplayProps {
  price: number | null;
  priceHistory: PriceTick[];
  isConnected: boolean;
  entryPrice?: number;
  countdown?: number;
  direction?: string;
  isPlaying: boolean;
}

/**
 * 实时 BTC 价格显示 + TradingView 专业图表
 */
export default function BtcPriceDisplay({
  price,
  priceHistory,
  isConnected,
  entryPrice,
  countdown,
  direction,
  isPlaying,
}: BtcPriceDisplayProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const entryLineRef = useRef<ReturnType<ISeriesApi<'Area'>['createPriceLine']> | null>(null);

  // Determine color based on trend
  const priceChange = useMemo(() => {
    if (!entryPrice || !price) return null;
    const diff = price - entryPrice;
    const pct = (diff / entryPrice) * 100;
    return { diff, pct, isUp: diff > 0, isDown: diff < 0 };
  }, [price, entryPrice]);

  const isUp = priceHistory.length >= 2
    ? priceHistory[priceHistory.length - 1].price >= priceHistory[0].price
    : true;
  const chartUp = isPlaying ? (priceChange ? priceChange.isUp : isUp) : isUp;

  // Track tick-by-tick direction (compare last two prices)
  const prevPriceRef = useRef<number | null>(null);
  const tickDirection = useMemo(() => {
    if (!price || prevPriceRef.current === null) return 'neutral' as const;
    if (price > prevPriceRef.current) return 'up' as const;
    if (price < prevPriceRef.current) return 'down' as const;
    return 'neutral' as const;
  }, [price]);
  // Update prev price after computing direction
  useEffect(() => {
    if (price) prevPriceRef.current = price;
  }, [price]);

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 200,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255,255,255,0.3)',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 2,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        mode: 0, // Normal
        vertLine: { visible: false },
        horzLine: {
          color: 'rgba(255,255,255,0.15)',
          labelVisible: false,
        },
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#4ade80',
      topColor: 'rgba(74, 222, 128, 0.2)',
      bottomColor: 'rgba(74, 222, 128, 0)',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Responsive resize
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    ro.observe(chartContainerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      entryLineRef.current = null;
    };
  }, []);

  // Timezone offset in seconds (lightweight-charts displays UTC, so we shift data to local)
  const tzOffsetSec = useMemo(() => -(new Date().getTimezoneOffset() * 60), []);

  // Update series data + colors when priceHistory changes
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || priceHistory.length < 1) return;

    const data: LineData<Time>[] = priceHistory.map(t => ({
      time: (t.time + tzOffsetSec) as Time,
      value: t.price,
    }));

    series.setData(data);

    // Set visible range to show last 5 minutes
    const chart = chartRef.current;
    if (chart && data.length > 0) {
      const now = Math.floor(Date.now() / 1000) + tzOffsetSec;
      chart.timeScale().setVisibleRange({
        from: (now - 300) as Time,
        to: (now + 5) as Time,
      });
    }

    // Update colors based on trend
    const lineColor = chartUp ? '#4ade80' : '#f87171';
    const topColor = chartUp ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)';
    const bottomColor = chartUp ? 'rgba(74, 222, 128, 0)' : 'rgba(248, 113, 113, 0)';
    series.applyOptions({ lineColor, topColor, bottomColor });
  }, [priceHistory, chartUp, tzOffsetSec]);

  // Entry price line
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    // Remove old line
    if (entryLineRef.current) {
      series.removePriceLine(entryLineRef.current);
      entryLineRef.current = null;
    }

    // Add new line if playing
    if (isPlaying && entryPrice) {
      entryLineRef.current = series.createPriceLine({
        price: entryPrice,
        color: '#fbbf24',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'Entry',
      });
    }
  }, [isPlaying, entryPrice]);

  return (
    <div className="flex flex-col items-center justify-center w-full px-2 gap-1">
      {/* Connection indicator + Price */}
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} ${isConnected ? 'animate-pulse' : ''}`} />
        <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">BTC/USDT</span>
      </div>

      {/* Price */}
      <div className="text-center">
        <div className={`text-[28px] leading-none font-black tabular-nums tracking-tight transition-colors duration-300 ${
          isPlaying
            ? (priceChange?.isUp ? 'text-green-400' : priceChange?.isDown ? 'text-red-400' : 'text-white')
            : (tickDirection === 'up' ? 'text-green-400' : tickDirection === 'down' ? 'text-red-400' : 'text-white')
        }`}>
          {price ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
        </div>
        {isPlaying && priceChange && (
          <div className={`text-xs font-semibold mt-1 ${priceChange.isUp ? 'text-green-400' : priceChange.isDown ? 'text-red-400' : 'text-white/40'}`}>
            {priceChange.diff >= 0 ? '+' : ''}{priceChange.diff.toFixed(2)} ({priceChange.pct >= 0 ? '+' : ''}{priceChange.pct.toFixed(4)}%)
          </div>
        )}
      </div>

      {/* TradingView Chart */}
      <div ref={chartContainerRef} className="w-full" />

      {/* Countdown + Direction indicator during play */}
      {isPlaying && countdown != null && (
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
            direction === 'bull' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {direction === 'bull' ? '↑ BULL' : '↓ BEAR'}
          </span>
          <span className="text-lg font-black text-white tabular-nums">
            {countdown}s
          </span>
        </div>
      )}
    </div>
  );
}
