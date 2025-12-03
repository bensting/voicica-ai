import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.voicica.app',
  appName: 'Voicica AI',
  webDir: 'out',

  // 远程模式：直接加载线上网页（支持热更新）
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://voicica.ai/studio',
    cleartext: true,
    // 允许导航到外部链接
    allowNavigation: ['*.voicica.ai', '*.stripe.com', '*.google.com'],
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