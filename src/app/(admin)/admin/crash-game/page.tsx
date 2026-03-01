'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAdminCrashConfig,
  updateAdminCrashConfig,
  getAdminCrashStats,
  getAdminCrashRounds,
  type AdminCrashConfig,
  type AdminCrashStats,
  type AdminCrashRound,
} from '@/actions/admin/crash-game';

export default function CrashGameAdminPage() {
  const [config, setConfig] = useState<AdminCrashConfig | null>(null);
  const [stats, setStats] = useState<AdminCrashStats | null>(null);
  const [rounds, setRounds] = useState<AdminCrashRound[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configData, statsData, roundsData] = await Promise.all([
        getAdminCrashConfig(),
        getAdminCrashStats(),
        getAdminCrashRounds(page),
      ]);
      setConfig(configData);
      setStats(statsData);
      setRounds(roundsData.rounds);
      setTotal(roundsData.total);
    } catch (error) {
      console.error('Failed to load crash game data:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const result = await updateAdminCrashConfig(config);
      if (result.success) {
        alert('Configuration saved successfully');
      } else {
        alert('Failed to save: ' + result.error);
      }
    } catch (error) {
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crash Game</h1>
        <p className="text-gray-600 mt-1">Game configuration, statistics, and round history</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Rounds', value: stats.totalRounds.toLocaleString() },
            { label: 'Total Bets', value: stats.totalBetAmount.toLocaleString() },
            { label: 'House Profit', value: stats.houseProfit.toLocaleString(), color: stats.houseProfit >= 0 ? 'text-green-600' : 'text-red-600' },
            { label: 'Player P&L', value: stats.totalProfit.toLocaleString(), color: stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600' },
            { label: 'Avg Crash Point', value: `${stats.avgCrashPoint}x` },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-lg font-bold mt-1 ${stat.color || 'text-gray-900'}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Config Form */}
      {config && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="block">
              <span className="text-sm text-gray-600">Enabled</span>
              <select
                value={config.enabled ? 'true' : 'false'}
                onChange={(e) => setConfig({ ...config, enabled: e.target.value === 'true' })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">Min Bet</span>
              <input
                type="number"
                value={config.minBet}
                onChange={(e) => setConfig({ ...config, minBet: Number(e.target.value) })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">Max Bet</span>
              <input
                type="number"
                value={config.maxBet}
                onChange={(e) => setConfig({ ...config, maxBet: Number(e.target.value) })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">House Edge %</span>
              <input
                type="number"
                step="0.1"
                value={config.houseEdgePercent}
                onChange={(e) => setConfig({ ...config, houseEdgePercent: Number(e.target.value) })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">Speed</span>
              <input
                type="number"
                step="0.00001"
                value={config.speed}
                onChange={(e) => setConfig({ ...config, speed: Number(e.target.value) })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">Max Duration (s)</span>
              <input
                type="number"
                value={config.maxDurationSeconds}
                onChange={(e) => setConfig({ ...config, maxDurationSeconds: Number(e.target.value) })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600">Grace Period (ms)</span>
              <input
                type="number"
                value={config.gracePeriodMs}
                onChange={(e) => setConfig({ ...config, gracePeriodMs: Number(e.target.value) })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
              >
                {saving ? 'Saving...' : 'Save Config'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rounds Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Round History ({total})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">User</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Bet</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Crash@</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Cash Out@</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Profit</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rounds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No rounds yet</td>
                </tr>
              ) : (
                rounds.map((round) => (
                  <tr key={round.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{round.roundId.substring(0, 8)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{round.userId.substring(0, 12)}...</td>
                    <td className="px-4 py-3 text-right">{round.betAmount}</td>
                    <td className="px-4 py-3 text-right font-medium">{round.crashPoint.toFixed(2)}x</td>
                    <td className="px-4 py-3 text-right">{round.cashOutMultiplier ? `${round.cashOutMultiplier.toFixed(2)}x` : '-'}</td>
                    <td className={`px-4 py-3 text-right font-medium ${(round.profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {round.profit != null ? round.profit.toFixed(1) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        round.status === 'cashed_out' ? 'bg-green-100 text-green-700' :
                        round.status === 'crashed' ? 'bg-red-100 text-red-700' :
                        round.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {round.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(round.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
