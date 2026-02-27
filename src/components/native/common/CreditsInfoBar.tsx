'use client';

import CreditsIcon from './CreditsIcon';

interface CreditsInfoBarProps {
  credits: number;
  className?: string;
}

/**
 * 积分信息栏
 * 显示当前 $VOICICA 余额
 */
export default function CreditsInfoBar({
  credits,
  className = ''
}: CreditsInfoBarProps) {
  return (
    <div className={`flex items-center text-gray-400 text-xs ${className}`}>
      <CreditsIcon className="w-3.5 h-3.5 mr-1.5" />
      <span>$VOICICA: {parseFloat(credits.toFixed(4))}</span>
    </div>
  );
}
