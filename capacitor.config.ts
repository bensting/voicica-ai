import type { CapacitorConfig } from '@capacitor/cli';

// 服务器 URL 配置
const serverUrl = process.env.CAPACITOR_SERVER_URL || 'https://voicica.ai/studio';

// 根据 URL 确定允许导航的域名
const getAllowedDomains = (url: string): string[] => {
  const baseDomains = ['*.stripe.com', '*.google.com'];

  if (url.includes('ai-voice-labs.com')) {
    return ['*.ai-voice-labs.com', ...baseDomains];
  }
  return ['*.voicica.ai', ...baseDomains];
};

const config: CapacitorConfig = {
  appId: 'ai.voicica.app',
  appName: 'Voicica AI',
  webDir: 'out',

  // 远程模式：直接加载线上网页（支持热更新）
  server: {
    url: serverUrl,
    cleartext: true,
    // 允许导航到外部链接（根据 URL 自动配置）
    allowNavigation: getAllowedDomains(serverUrl),
  },

  // iOS 配置
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    // 允许混合内容
    allowsLinkPreview: true,
    scrollEnabled: true,
  },

  // Android 配置
  android: {
    backgroundColor: '#ffffff',
    // 允许混合内容
    allowMixedContent: true,
    // 启用硬件加速
    useLegacyBridge: false,
  },

  // 插件配置
  plugins: {
    // 启动画面
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#9333ea',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
    },
    // 状态栏
    StatusBar: {
      style: 'dark',
      backgroundColor: '#9333ea',
    },
    // 键盘
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;