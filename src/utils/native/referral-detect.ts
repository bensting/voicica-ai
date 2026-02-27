import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';

const REFERRAL_PREFIX = 'VOICICA-REF:';
const REFERRAL_CODE_REGEX = /^[A-Z0-9]{6}$/;

/**
 * 从剪贴板检测推荐码
 * 格式: VOICICA-REF:ABCDEF
 */
export async function detectReferralFromClipboard(): Promise<string | null> {
  console.log('[Referral] isNativePlatform:', Capacitor.isNativePlatform());
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const { value } = await Clipboard.read();
    console.log('[Referral] clipboard value:', value);
    if (value && value.startsWith(REFERRAL_PREFIX)) {
      const code = value.replace(REFERRAL_PREFIX, '').trim();
      if (REFERRAL_CODE_REGEX.test(code)) {
        return code;
      }
    }
  } catch (e) {
    console.error('[Referral] clipboard read error:', e);
  }

  return null;
}

/**
 * 检测推荐码（剪贴板优先）
 * 如果已有 pending_referral_code，跳过检测
 */
export async function detectReferralCode(): Promise<string | null> {
  const pending = localStorage.getItem('pending_referral_code');
  const dismissed = sessionStorage.getItem('referral_detect_dismissed');
  console.log('[Referral] pending:', pending, 'dismissed:', dismissed);

  // 已有 pending code，不再检测
  if (pending) return null;

  // 已经检测过且用户拒绝了，不再弹窗（本次会话）
  if (dismissed) return null;

  // 从剪贴板检测
  const code = await detectReferralFromClipboard();
  console.log('[Referral] detected code:', code);
  return code;
}

/**
 * 用户确认后：存 localStorage + 清除剪贴板
 */
export async function confirmReferralCode(code: string) {
  localStorage.setItem('pending_referral_code', code);
  // 清除剪贴板中的推荐码，避免重复检测
  try {
    await Clipboard.write({ string: '' });
  } catch {
    /* ignore */
  }
}

/**
 * 用户拒绝后：标记本次会话不再弹窗
 */
export function dismissReferralDetect() {
  sessionStorage.setItem('referral_detect_dismissed', '1');
}
