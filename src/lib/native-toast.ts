/**
 * Native Toast Utility
 *
 * 使用 Capacitor Toast 插件显示原生 Toast
 * Web 端回退到自定义 Toast 实现
 */
import { Capacitor } from '@capacitor/core';

export interface ToastOptions {
  text: string;
  duration?: 'short' | 'long';
  position?: 'top' | 'center' | 'bottom';
}

/**
 * 显示 Toast 提示
 */
export async function showToast(options: ToastOptions): Promise<void> {
  const { text, duration = 'short', position = 'bottom' } = options;

  // 原生平台使用 Capacitor Toast
  if (Capacitor.isNativePlatform()) {
    try {
      const { Toast } = await import('@capacitor/toast');
      await Toast.show({
        text,
        duration,
        position,
      });
      return;
    } catch {
      console.warn('Toast plugin not available, falling back to web toast');
    }
  }

  // Web 端使用自定义 Toast
  showWebToast(text, duration);
}

/**
 * Web 端自定义 Toast
 */
function showWebToast(text: string, duration: 'short' | 'long' = 'short'): void {
  // 移除已存在的 toast
  const existingToast = document.getElementById('web-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // 创建 toast 元素
  const toast = document.createElement('div');
  toast.id = 'web-toast';
  toast.textContent = text;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 99999;
    animation: fadeIn 0.2s ease-out;
    max-width: 80%;
    text-align: center;
  `;

  // 添加动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateX(-50%) translateY(20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(toast);

  // 设置消失时间
  const timeout = duration === 'short' ? 2000 : 3500;
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.2s ease-in forwards';
    setTimeout(() => {
      toast.remove();
      style.remove();
    }, 200);
  }, timeout);
}
