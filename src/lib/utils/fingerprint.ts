import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * 设备指纹工具
 *
 * 用于生成和管理设备唯一标识，支持匿名用户访问后端 API
 */

type FingerprintAgent = Awaited<ReturnType<typeof FingerprintJS.load>>;
let fpPromise: Promise<FingerprintAgent> | null = null;
const FINGERPRINT_STORAGE_KEY = 'device_fingerprint';

/**
 * 初始化 FingerprintJS
 */
function initFingerprint() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
}

/**
 * 生成设备指纹
 *
 * 1. 优先从 localStorage 读取已保存的指纹
 * 2. 如果不存在，使用 FingerprintJS 生成新的指纹
 * 3. 将新生成的指纹保存到 localStorage
 *
 * @returns 设备指纹字符串
 */
export async function getDeviceFingerprint(): Promise<string> {
  try {
    // 检查浏览器环境
    if (typeof window === 'undefined') {
      console.warn('getDeviceFingerprint: Not in browser environment');
      return 'ssr-fallback';
    }

    // 1. 尝试从 localStorage 获取已保存的指纹
    const savedFingerprint = localStorage.getItem(FINGERPRINT_STORAGE_KEY);
    if (savedFingerprint) {
      return savedFingerprint;
    }

    // 2. 生成新的设备指纹
    const fp = await initFingerprint();
    const result = await fp.get();
    const visitorId = result.visitorId;

    // 3. 保存到 localStorage
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, visitorId);

    return visitorId;
  } catch (error) {
    console.error('[Fingerprint] 生成设备指纹失败:', error);

    // 降级方案：生成简单的 UUID 并保存
    const fallbackId = generateFallbackId();
    localStorage.setItem(FINGERPRINT_STORAGE_KEY, fallbackId);

    return fallbackId;
  }
}

/**
 * 降级方案：生成简单的 UUID
 */
function generateFallbackId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 清除设备指纹
 * 用于测试或用户主动清除数据
 */
export function clearDeviceFingerprint(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(FINGERPRINT_STORAGE_KEY);
  }
}

/**
 * 检查是否有已保存的设备指纹
 */
export function hasDeviceFingerprint(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(FINGERPRINT_STORAGE_KEY);
}