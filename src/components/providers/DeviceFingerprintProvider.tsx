'use client';

import { useEffect } from 'react';
import { getDeviceFingerprint } from '@/lib/utils/fingerprint';

/**
 * Device Fingerprint Provider
 *
 * 在应用加载时初始化设备指纹并设置到 cookie
 * 用于支持匿名用户访问后端 API
 *
 * 特性:
 * - 自动生成并保存设备指纹到 localStorage
 * - 将指纹设置为 cookie 供 middleware 使用
 * - 静默运行,不影响页面渲染
 */
export default function DeviceFingerprintProvider() {
  useEffect(() => {
    const initializeFingerprint = async () => {
      try {
        const fingerprint = await getDeviceFingerprint();

        // 设置 cookie 供 middleware 读取
        // 使用 SameSite=Strict 和 Secure (production) 确保安全性
        const isProduction = window.location.protocol === 'https:';
        const cookieOptions = [
          `device-fingerprint=${fingerprint}`,
          'path=/',
          'max-age=31536000', // 1 year
          'SameSite=Strict',
          isProduction ? 'Secure' : '',
        ]
          .filter(Boolean)
          .join('; ');

        document.cookie = cookieOptions;

        console.log('✅ [DeviceFingerprintProvider] 设备指纹已设置到 cookie');
      } catch (error) {
        console.error('❌ [DeviceFingerprintProvider] 设备指纹初始化失败:', error);
      }
    };

    void initializeFingerprint();
  }, []);

  // 不渲染任何 UI
  return null;
}