/**
 * Credits Check Utility
 * 在生成前检查积分是否足够
 */
import { showToast } from './native-toast';

interface CheckCreditsOptions {
  currentCredits: number;
  requiredCredits: number;
  onInsufficientCredits: () => void; // 积分不足时的回调（通常是跳转订阅页）
}

/**
 * 检查积分是否足够
 * @returns true 如果积分足够，false 如果积分不足
 */
export function checkCreditsBeforeGenerate({
  currentCredits,
  requiredCredits,
  onInsufficientCredits,
}: CheckCreditsOptions): boolean {
  if (currentCredits < requiredCredits) {
    // 显示 Toast 提示
    showToast({
      text: 'Insufficient credits',
      duration: 'short',
    });
    // 执行回调（跳转订阅页）
    onInsufficientCredits();
    return false;
  }
  return true;
}
