'use client';

// 四角星积分图标
const CreditIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L14.5 9.5L23 12L14.5 14.5L12 23L9.5 14.5L1 12L9.5 9.5L12 1Z" />
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
