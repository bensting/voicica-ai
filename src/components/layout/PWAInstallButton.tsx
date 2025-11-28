'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // 检查是否已经安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // 监听 beforeinstallprompt 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 监听 appinstalled 事件
    const handleAppInstalled = () => {
      setShowButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    setShowInstallDialog(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // 显示浏览器的安装提示
    await deferredPrompt.prompt();

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // 清理
    setDeferredPrompt(null);
    setShowButton(false);
    setShowInstallDialog(false);
  };

  const handleCancel = () => {
    setShowInstallDialog(false);
  };

  if (!showButton) return null;

  return (
    <>
      {/* 固定浮动按钮 */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleInstallClick}
          className="group relative bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-l-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          style={{
            width: isHovered ? '200px' : '56px',
            height: '56px',
          }}
        >
          <div className="flex items-center justify-start h-full px-4 gap-3">
            <Download className="w-6 h-6 flex-shrink-0" />
            <span
              className={`text-sm font-medium whitespace-nowrap transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {t('pwa.installShortcut') || 'Install App'}
            </span>
          </div>
        </button>
      </div>

      {/* 安装对话框 */}
      {showInstallDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* 头部 */}
            <div className="relative bg-gradient-to-br from-purple-600 to-purple-700 px-6 py-8 text-white">
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                  <Download className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('common.brand') || 'Voicica AI'}</h2>
                  <p className="text-sm text-purple-100 mt-1">
                    {typeof window !== 'undefined' ? window.location.hostname : 'voicica.ai'}
                  </p>
                </div>
              </div>
            </div>

            {/* 内容 */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('pwa.installTitle') || 'Install Application'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {t('pwa.installDescription') ||
                  'Install this application on your device for quick and easy access, even when offline.'}
              </p>

              {/* 功能特点 */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      {t('pwa.feature1') || 'Fast access from your desktop or home screen'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      {t('pwa.feature2') || 'Works offline with cached content'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      {t('pwa.feature3') || 'Lightweight, no app store needed'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl"
                >
                  {t('pwa.install') || 'Install'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}