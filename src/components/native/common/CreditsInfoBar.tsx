'use client';

import CreditsIcon from './CreditsIcon';
import { formatCredits } from '@/utils/formatCredits';

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
      <span>$VOICICA: {formatCredits(credits)}</span>
    </div>
  );
}
