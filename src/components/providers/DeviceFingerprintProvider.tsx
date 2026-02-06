'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getDeviceFingerprint } from '@/lib/utils/fingerprint';
import { detectPlatform } from '@/lib/platform';

interface DeviceFingerprintContextType {
  deviceFingerprint: string | null;
  loading: boolean;
}

const DeviceFingerprintContext = createContext<DeviceFingerprintContextType>({
  deviceFingerprint: null,
  loading: true,
});

/**
 * Device Fingerprint Provider
 *
 * 在应用加载时初始化设备指纹并设置到 cookie
 * 同时提供 Context 供子组件使用
 *
 * 特性:
 * - 自动生成并保存设备指纹到 localStorage
 * - 将指纹设置为 cookie 供 middleware 使用
 * - 提供 Context 供子组件获取设备指纹
 */
export default function DeviceFingerprintProvider({ children }: { children?: ReactNode }) {
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeFingerprint = async () => {
      try {
        const fingerprint = await getDeviceFingerprint();

        // 设置 cookie 供 middleware 读取
        // 使用 SameSite=Lax（与 firebase-token 一致）确保跨页面导航时 cookie 能被发送
        const isProduction = window.location.protocol === 'https:';
        const cookieOptions = [
          `device-fingerprint=${fingerprint}`,
          'path=/',
          'max-age=31536000', // 1 year
          'SameSite=Lax',
          isProduction ? 'Secure' : '',
        ]
          .filter(Boolean)
          .join('; ');

        document.cookie = cookieOptions;

        // 同时设置平台 cookie
        const platform = detectPlatform();
        const platformCookieOptions = [
          `platform=${platform}`,
          'path=/',
          'max-age=31536000', // 1 year
          'SameSite=Lax',
          isProduction ? 'Secure' : '',
        ]
          .filter(Boolean)
          .join('; ');

        document.cookie = platformCookieOptions;

        // 设置到 state 供 Context 使用
        setDeviceFingerprint(fingerprint);
      } catch (error) {
        console.error('[DeviceFingerprintProvider] 设备指纹初始化失败:', error);
      } finally {
        setLoading(false);
      }
    };

    void initializeFingerprint();
  }, []);

  // 如果有 children，包裹它们；否则返回 null（向后兼容）
  if (children) {
    return (
      <DeviceFingerprintContext.Provider value={{ deviceFingerprint, loading }}>
        {children}
      </DeviceFingerprintContext.Provider>
    );
  }

  return null;
}

export function useDeviceFingerprint() {
  return useContext(DeviceFingerprintContext);
}