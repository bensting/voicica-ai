'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { createCreditsSSE, closeCreditsSSE, type CreditsSSEData } from '@/lib/api/sse';

/**
 * SSE 测试页面
 *
 * 用于测试积分实时推送功能是否正常工作
 */
export default function SSETestPage() {
  const { user, loading: authLoading } = useAuth();
  const { credits } = useCredits();
  const [logs, setLogs] = useState<string[]>([]);
  const [sseStatus, setSSEStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<CreditsSSEData | null>(null);
  const [manualEventSource, setManualEventSource] = useState<EventSource | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50)); // 保留最近50条
  };

  // 手动测试 SSE 连接
  const testSSEConnection = async () => {
    addLog('开始手动测试 SSE 连接...');
    setSSEStatus('connecting');

    try {
      const token = user ? await user.getIdToken() : null;
      const deviceFingerprint = !user ? localStorage.getItem('deviceFingerprint') : null;

      addLog(`认证信息: ${token ? 'Token (已登录)' : deviceFingerprint ? 'Device Fingerprint (匿名)' : '无'}`);

      const eventSource = createCreditsSSE({
        token: token || undefined,
        deviceFingerprint: deviceFingerprint || undefined,
        onMessage: (data) => {
          addLog(`✅ 收到积分更新: ${data.credits} (timestamp: ${data.timestamp})`);
          setLastUpdate(data);
          setSSEStatus('connected');
        },
        onError: (error) => {
          addLog(`❌ SSE 连接错误`);
          console.error('SSE Error:', error);
          setSSEStatus('error');
        },
        onOpen: () => {
          addLog('✅ SSE 连接已建立');
          setSSEStatus('connected');
        },
      });

      setManualEventSource(eventSource);
      addLog('EventSource 已创建');
    } catch (error) {
      addLog(`❌ 创建 SSE 连接失败: ${error}`);
      setSSEStatus('error');
    }
  };

  // 断开连接
  const disconnectSSE = () => {
    if (manualEventSource) {
      closeCreditsSSE(manualEventSource);
      setManualEventSource(null);
      setSSEStatus('disconnected');
      addLog('已断开 SSE 连接');
    }
  };

  // 清除日志
  const clearLogs = () => {
    setLogs([]);
    addLog('日志已清除');
  };

  // 页面卸载时断开连接
  useEffect(() => {
    return () => {
      if (manualEventSource) {
        closeCreditsSSE(manualEventSource);
      }
    };
  }, [manualEventSource]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">SSE 积分推送测试</h1>
        <p className="text-gray-600 mb-8">测试实时积分更新功能是否正常工作</p>

        {/* 状态卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* 认证状态 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">认证状态</h3>
            <div className="flex items-center gap-2">
              {authLoading ? (
                <>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-semibold">加载中...</span>
                </>
              ) : user ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-lg font-semibold">已登录</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-lg font-semibold">匿名用户</span>
                </>
              )}
            </div>
            {user && (
              <p className="text-sm text-gray-600 mt-2 truncate">{user.email}</p>
            )}
          </div>

          {/* SSE 连接状态 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">SSE 连接</h3>
            <div className="flex items-center gap-2">
              {sseStatus === 'disconnected' && (
                <>
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-lg font-semibold">未连接</span>
                </>
              )}
              {sseStatus === 'connecting' && (
                <>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-semibold">连接中...</span>
                </>
              )}
              {sseStatus === 'connected' && (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-lg font-semibold">已连接</span>
                </>
              )}
              {sseStatus === 'error' && (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-lg font-semibold">连接错误</span>
                </>
              )}
            </div>
            {manualEventSource && (
              <p className="text-sm text-gray-600 mt-2">
                ReadyState: {manualEventSource.readyState === 0 ? 'CONNECTING' : manualEventSource.readyState === 1 ? 'OPEN' : 'CLOSED'}
              </p>
            )}
          </div>

          {/* 当前积分 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">当前积分</h3>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
              </svg>
              <span className="text-2xl font-bold text-gray-900">{credits.toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">来自 CreditsContext</p>
          </div>
        </div>

        {/* 最后更新信息 */}
        {lastUpdate && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-green-800 mb-2">最后收到的更新</h3>
            <pre className="text-xs bg-white p-3 rounded border border-green-200 overflow-x-auto">
              {JSON.stringify(lastUpdate, null, 2)}
            </pre>
          </div>
        )}

        {/* 控制按钮 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">测试控制</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testSSEConnection}
              disabled={sseStatus === 'connected' || authLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              连接 SSE
            </button>
            <button
              onClick={disconnectSSE}
              disabled={sseStatus === 'disconnected'}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              断开连接
            </button>
            <button
              onClick={clearLogs}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              清除日志
            </button>
          </div>
        </div>

        {/* 日志面板 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">实时日志</h3>
          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-sm">暂无日志...</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-sm font-mono ${
                      log.includes('✅')
                        ? 'text-green-400'
                        : log.includes('❌')
                        ? 'text-red-400'
                        : 'text-gray-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 说明 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">测试说明</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>点击"连接 SSE"按钮建立 SSE 连接</li>
            <li>后端每 3 秒推送一次积分更新</li>
            <li>连接成功后,日志面板会显示收到的数据</li>
            <li>当前积分卡片会实时更新(通过 CreditsContext)</li>
            <li>如果连接失败,请检查后端是否支持 Cookie 认证</li>
          </ul>
        </div>
      </div>
    </div>
  );
}