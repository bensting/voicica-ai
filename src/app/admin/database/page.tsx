'use client';

/**
 * Database Management Page
 *
 * View and manage D1 database tables
 */
import { useState, useEffect } from 'react';

interface TableInfo {
  name: string;
  exists: boolean;
  rowCount?: number;
}

interface SchemaStatus {
  tables: TableInfo[];
  error?: string;
}

export default function DatabasePage() {
  const [status, setStatus] = useState<SchemaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/database/status');
      const data = await res.json() as SchemaStatus;
      setStatus(data);
    } catch (error) {
      setStatus({ tables: [], error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/database/sync', {
        method: 'POST',
      });
      const data = await res.json() as { success: boolean; message?: string; error?: string };

      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Sync completed' });
        // Refresh status
        await fetchStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Sync failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: String(error) });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTable = async (tableName: string) => {
    setMessage(null);
    try {
      const res = await fetch('/api/admin/database/create-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName }),
      });
      const data = await res.json() as { success: boolean; error?: string };

      if (data.success) {
        setMessage({ type: 'success', text: `Table "${tableName}" created successfully` });
        await fetchStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create table' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: String(error) });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Database Management</h2>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? 'Syncing...' : 'Sync All Tables'}
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {status?.error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {status.error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Table Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rows</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {status?.tables.map((table) => (
                <tr key={table.name} className="border-b last:border-b-0">
                  <td className="py-3 px-4 text-sm text-gray-900 font-mono">{table.name}</td>
                  <td className="py-3 px-4">
                    {table.exists ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Exists
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Not Created
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {table.exists ? table.rowCount ?? '-' : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {!table.exists && (
                      <button
                        onClick={() => handleCreateTable(table.name)}
                        className="text-sm text-purple-600 hover:text-purple-700"
                      >
                        Create
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Schema Tables</h3>
        <p className="text-sm text-gray-600 mb-4">
          Total tables defined in schema: <strong>{status?.tables.length || 0}</strong>
        </p>
        <p className="text-sm text-gray-600">
          Tables created: <strong>{status?.tables.filter(t => t.exists).length || 0}</strong>
        </p>
      </div>
    </div>
  );
}