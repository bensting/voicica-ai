/**
 * Credits Check Utility
 * 在生成前检查积分是否足够
 */

interface CheckCreditsOptions {
  currentCredits: number;
  requiredCredits: number;
  onInsufficientCredits: () => void; // 积分不足时的回调（显示弹窗）
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
    // 执行回调（显示积分不足弹窗）
    onInsufficientCredits();
    return false;
  }
  return true;
}
