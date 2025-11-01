'use client';

import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

// 定义 beforeinstallprompt 事件类型
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA 安装提示组件
 *
 * 功能:
 * - Android: 监听 beforeinstallprompt 事件，显示安装按钮
 * - iOS: 检测 iOS Safari，显示手动安装指引
 * - 用户可以关闭提示
 * - 记住用户选择（关闭后不再显示）
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 检查用户是否之前关闭过提示
    const isDismissed = localStorage.getItem('pwa-install-dismissed');
    if (isDismissed === 'true') {
      return;
    }

    // 检查是否已经安装
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      return;
    }

    // 检测 iOS
    const windowWithMSStream = window as Window & { MSStream?: unknown };
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !windowWithMSStream.MSStream;

    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
    const isInStandaloneMode = ('standalone' in window.navigator) && navigatorWithStandalone.standalone;

    setIsIOS(isIOSDevice);

    if (isIOSDevice && !isInStandaloneMode) {
      // iOS Safari: 显示手动安装指引
      setShowPrompt(true);
    } else {
      // Android: 监听 beforeinstallprompt 事件
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // 显示安装提示
    deferredPrompt.prompt();

    // 等待用户选择
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`PWA 安装结果: ${outcome}`);

    // 清理
    setDeferredPrompt(null);
    setShowPrompt(false);

    // 如果用户拒绝，记住这个选择
    if (outcome === 'dismissed') {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // 不显示提示
  if (!showPrompt) {
    return null;
  }

  // iOS 引导界面
  if (isIOS) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-xs">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl shadow-2xl p-4">
          {/* 关闭按钮 */}
          <button
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 内容 */}
          <div className="flex items-start gap-3">
            {/* 图标 */}
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Share className="w-5 h-5" />
            </div>

            {/* 文字 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base mb-2">安装到主屏幕</h3>
              <div className="text-xs text-purple-100 space-y-1.5">
                <p className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>点击底部 <Share className="w-3 h-3 inline mx-0.5" /> 分享按钮</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>选择&ldquo;添加到主屏幕&rdquo;</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android 安装按钮
  if (!deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl shadow-2xl p-4 max-w-sm">
        {/* 关闭按钮 */}
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 内容 */}
        <div className="flex items-start gap-4">
          {/* 图标 */}
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>

          {/* 文字 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1">安装应用</h3>
            <p className="text-sm text-purple-100 mb-3">
              快速访问，离线使用，更好的体验
            </p>

            {/* 安装按钮 */}
            <button
              onClick={handleInstall}
              className="w-full bg-white text-purple-600 font-semibold py-2 px-4 rounded-lg hover:bg-purple-50 transition-colors"
            >
              立即安装
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}