'use client';

import CreditsIcon from './CreditsIcon';

export interface CreditRule {
  name: string;
  credits: number;
}

interface CreditsRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: CreditRule[];
}

/**
 * 积分规则弹窗
 * 显示功能的积分消耗规则
 */
export default function CreditsRuleModal({
  isOpen,
  onClose,
  rules
}: CreditsRuleModalProps) {
  if (!isOpen) return null;

  const total = rules.reduce((sum, rule) => sum + rule.credits, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-[#1a1a2e] rounded-2xl p-5 mx-4 min-w-[280px] max-w-sm">
        <h3 className="text-white font-semibold mb-4">Credit Rules</h3>

        {/* 分割线 */}
        <div className="border-t border-gray-700 mb-4" />

        {/* 规则列表 */}
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">{rule.name}</span>
              <div className="flex items-center gap-1 text-gray-300 text-sm">
                <CreditsIcon className="w-3.5 h-3.5" />
                <span>{rule.credits}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 分割线 */}
        <div className="border-t border-gray-700 my-4" />

        {/* 总计 */}
        <div className="flex items-center justify-end gap-1 text-gray-300 text-sm">
          <span>Total:</span>
          <CreditsIcon className="w-3.5 h-3.5" />
          <span>{total}</span>
        </div>
      </div>
    </div>
  );
}
