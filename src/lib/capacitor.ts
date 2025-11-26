/**
 * Capacitor 工具库
 * 用于检测原生环境和调用原生功能
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * 检测是否在原生 App 中运行
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * 获取当前平台
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

/**
 * 检测是否是 iOS
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * 检测是否是 Android
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * 隐藏启动画面
 */
export const hideSplashScreen = async (): Promise<void> => {
  if (isNativeApp()) {
    await SplashScreen.hide();
  }
};

/**
 * 设置状态栏样式
 */
export const setStatusBarStyle = async (style: 'light' | 'dark'): Promise<void> => {
  if (isNativeApp()) {
    await StatusBar.setStyle({
      style: style === 'light' ? Style.Light : Style.Dark,
    });
  }
};

/**
 * 触发触觉反馈
 */
export const hapticFeedback = async (
  style: 'light' | 'medium' | 'heavy' = 'medium'
): Promise<void> => {
  if (isNativeApp()) {
    const impactStyle =
      style === 'light'
        ? ImpactStyle.Light
        : style === 'heavy'
          ? ImpactStyle.Heavy
          : ImpactStyle.Medium;
    await Haptics.impact({ style: impactStyle });
  }
};

/**
 * 获取 App 信息
 */
export const getAppInfo = async () => {
  if (isNativeApp()) {
    return await App.getInfo();
  }
  return {
    name: 'Voicica AI',
    id: 'ai.voicica.app',
    build: process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0',
  };
};

/**
 * 监听 App 状态变化
 */
export const onAppStateChange = (
  callback: (state: { isActive: boolean }) => void
): (() => void) => {
  if (isNativeApp()) {
    const listener = App.addListener('appStateChange', callback);
    return () => {
      listener.then((l) => l.remove());
    };
  }
  return () => {};
};

/**
 * 监听返回按钮（Android）
 */
export const onBackButton = (callback: () => void): (() => void) => {
  if (isAndroid()) {
    const listener = App.addListener('backButton', callback);
    return () => {
      listener.then((l) => l.remove());
    };
  }
  return () => {};
};

/**
 * 退出 App（Android）
 */
export const exitApp = (): void => {
  if (isAndroid()) {
    App.exitApp();
  }
};

/**
 * 初始化 Capacitor（在 App 启动时调用）
 */
export const initCapacitor = async (): Promise<void> => {
  if (isNativeApp()) {
    // 隐藏启动画面
    await hideSplashScreen();

    // 设置状态栏
    await setStatusBarStyle('dark');

    console.log(`🚀 Capacitor initialized on ${getPlatform()}`);
  }
};