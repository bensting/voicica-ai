/**
 * SSE (Server-Sent Events) API
 *
 * 提供 SSE 连接管理和事件处理
 */

import { fetchEventSource } from '@microsoft/fetch-event-source';

export interface CreditsSSEData {
  credits: number;
  timestamp: number;
  user_id?: string;
  error?: string;
}

export interface SSEConnectionOptions {
  token?: string;
  deviceFingerprint?: string;
  onMessage?: (data: CreditsSSEData) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
}

/**
 * SSE 连接控制器
 * 用于控制连接的开启和关闭
 */
export class SSEController {
  private abortController: AbortController | null = null;

  close() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  getAbortController(): AbortController {
    this.abortController = new AbortController();
    return this.abortController;
  }
}

/**
 * 创建积分实时推送SSE连接
 *
 * 使用 fetch-event-source 库以支持自定义 Headers
 *
 * @param options - SSE连接配置
 * @returns SSEController 实例（用于控制连接）
 */
export function createCreditsSSE(options: SSEConnectionOptions): SSEController {
  const { token, deviceFingerprint, onMessage, onError, onOpen } = options;

  // 构建 SSE URL
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const sseUrl = `${baseUrl}/api/v1/sse/credits/stream`;

  console.log('[SSE API] 创建积分推送连接:', sseUrl);

  // 构建认证 headers
  const headers: Record<string, string> = {
    'Content-Type': 'text/event-stream',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('[SSE API] 使用 Token 认证');
  } else if (deviceFingerprint) {
    headers['X-Device-Fingerprint'] = deviceFingerprint;
    console.log('[SSE API] 使用设备指纹认证:', deviceFingerprint.substring(0, 16) + '...');
  } else {
    console.warn('[SSE API] 缺少认证信息');
  }

  const controller = new SSEController();
  const abortController = controller.getAbortController();

  // 使用 fetch-event-source 建立连接
  fetchEventSource(sseUrl, {
    headers,
    signal: abortController.signal,

    onopen: async (response) => {
      if (response.ok) {
        console.log('[SSE API] 连接已建立');
        if (onOpen) {
          onOpen();
        }
      } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        // 客户端错误（4xx，除了 429 Too Many Requests）
        console.error('[SSE API] 客户端错误:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('[SSE API] 错误详情:', errorText);

        if (onError) {
          onError(new Error(`HTTP ${response.status}: ${response.statusText}`));
        }

        // 不重试客户端错误
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } else {
        // 服务器错误（5xx）或其他错误 - 会自动重试
        console.error('[SSE API] 服务器错误:', response.status, response.statusText);
      }
    },

    onmessage: (event) => {
      try {
        const data: CreditsSSEData = JSON.parse(event.data);
        console.log('[SSE API] 收到积分更新:', data);

        if (data.error) {
          console.error('[SSE API] 服务器返回错误:', data.error);
        }

        if (onMessage) {
          onMessage(data);
        }
      } catch (error) {
        console.error('[SSE API] 解析SSE数据失败:', error, '原始数据:', event.data);
      }
    },

    onerror: (error) => {
      console.error('[SSE API] 连接错误:', error);

      if (onError) {
        onError(error);
      }

      // 如果是 AbortError，说明是主动关闭，不重试
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[SSE API] 连接已主动关闭');
        throw error; // 停止重试
      }

      // 其他错误会自动重试
    },

    openWhenHidden: true, // 即使标签页在后台也保持连接
  });

  return controller;
}

/**
 * 关闭SSE连接
 *
 * @param controller - SSEController 实例
 */
export function closeCreditsSSE(controller: SSEController | null): void {
  if (controller) {
    console.log('[SSE API] 关闭积分推送连接');
    controller.close();
  }
}

/**
 * 测试SSE连接是否正常工作
 *
 * @returns EventSource 实例
 */
export function createPingSSE(): EventSource {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const sseUrl = `${baseUrl}/api/v1/sse/credits/stream/ping`;

  console.log('[SSE API] 创建Ping测试连接:', sseUrl);

  const eventSource = new EventSource(sseUrl);

  eventSource.onmessage = (event) => {
    console.log('[SSE API] Ping响应:', event.data);
  };

  eventSource.onerror = (error) => {
    console.error('[SSE API] Ping连接错误:', error);
  };

  return eventSource;
}