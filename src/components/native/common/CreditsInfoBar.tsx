'use client';

import { useState } from 'react';
import CreditsIcon from './CreditsIcon';
import CreditsRuleModal, { type CreditRule } from './CreditsRuleModal';

const AlertCircleIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <circle cx="12" cy="16" r="0.5" fill="currentColor" />
  </svg>
);

interface CreditsInfoBarProps {
  credits: number;
  creditRules: CreditRule[];
  className?: string;
}

/**
 * 积分信息栏
 * 显示当前积分和积分规则入口
 */
export default function CreditsInfoBar({
  credits,
  creditRules,
  className = ''
}: CreditsInfoBarProps) {
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  return (
    <>
      <div className={`flex items-center justify-between text-gray-400 text-xs ${className}`}>
        {/* 左侧：积分显示 */}
        <div className="flex items-center gap-1.5">
          <CreditsIcon className="w-3.5 h-3.5" />
          <span>Credits: {credits}</span>
        </div>

        {/* 右侧：积分规则 */}
        <button
          onClick={() => setIsRuleModalOpen(true)}
          className="flex items-center gap-1 hover:text-gray-300 transition-colors"
        >
          <span>Credits Rule</span>
          <AlertCircleIcon />
        </button>
      </div>

      {/* 积分规则弹窗 */}
      <CreditsRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        rules={creditRules}
      />
    </>
  );
}
