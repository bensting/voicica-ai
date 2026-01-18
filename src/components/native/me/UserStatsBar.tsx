'use client';

// 星星/积分图标
const CreditIcon = () => (
  <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2z" />
  </svg>
);

interface UserStatsBarProps {
  planName?: string;
  credits?: number;
}

/**
 * 用户信息栏
 * 显示当前套餐和积分
 */
export default function UserStatsBar({
  planName = 'Free version',
  credits = 0,
}: UserStatsBarProps) {
  return (
    <div className="mx-4 flex items-center justify-center gap-8 py-3">
      {/* 套餐类型 */}
      <div className="text-gray-300 text-sm font-medium">
        {planName}
      </div>

      {/* 分隔线 */}
      <div className="h-4 w-px bg-gray-600" />

      {/* 积分 */}
      <div className="flex items-center gap-1.5">
        <CreditIcon />
        <span className="text-white font-semibold">{credits}</span>
      </div>
    </div>
  );
}
