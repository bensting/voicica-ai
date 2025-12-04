import type { CapacitorConfig } from '@capacitor/cli';

// 服务器 URL 配置
const serverUrl = process.env.CAPACITOR_SERVER_URL || 'https://www.voicica.ai/studio';

// 根据 URL 确定允许导航的域名
const getAllowedDomains = (url: string): string[] => {
  // 基础域名（支付、认证等）
  const baseDomains = [
    // Stripe 支付
    'stripe.com',
    '*.stripe.com',
    // Google 登录
    'google.com',
    '*.google.com',
    'accounts.google.com',
    '*.googleapis.com',
    // Firebase 认证
    '*.firebaseapp.com',
    '*.firebase.com',
    '*.firebaseio.com',
    // Apple 登录
    'apple.com',
    '*.apple.com',
    'appleid.apple.com',
    // Twitter/X 登录
    'twitter.com',
    '*.twitter.com',
    'x.com',
    '*.x.com',
  ];

  if (url.includes('ai-voice-labs.com')) {
    return [
      'ai-voice-labs.com',      // 主域名
      '*.ai-voice-labs.com',    // 子域名
      ...baseDomains
    ];
  }
  return [
    'voicica.ai',               // 主域名
    '*.voicica.ai',             // 子域名
    ...baseDomains
  ];
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
    // 添加自定义 User-Agent 标识，用于远程网页检测原生环境
    androidScheme: 'https',
  },

  // 自定义 User-Agent，用于远程网页检测是否在原生应用中
  appendUserAgent: 'VoicicaApp',

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
    // 状态栏 - light 表示白色文字图标（适配紫色背景）
    StatusBar: {
      style: 'light',
      backgroundColor: '#9333ea',
    },
    // 键盘
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    // Firebase Authentication - 配置支持的登录方式
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;