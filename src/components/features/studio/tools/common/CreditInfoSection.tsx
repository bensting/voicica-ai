/**
 * Credit Info Section Component
 *
 * 显示用户积分信息和扣费提示的公共组件
 * 可在各个工具页面中复用
 */

import { useState } from 'react';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import CreditsIcon from '@/components/icons/CreditsIcon';
import LoginModal from '@/components/features/auth/LoginModal';

interface CreditInfoSectionProps {
  /**
   * 每次操作扣除的积分数
   */
  creditCost: number;

  /**
   * 操作名称（用于提示文本）
   * 例如: "解析", "下载", "生成" 等
   */
  actionName?: string;

  /**
   * 变体样式
   * mobile: 移动端样式（更紧凑）
   * desktop: 桌面端样式（更宽松）
   */
  variant?: 'mobile' | 'desktop';
}

export default function CreditInfoSection({
  creditCost,
  actionName = '操作',
  variant = 'desktop',
}: CreditInfoSectionProps) {
  const { user } = useFirebaseAuth();
  const { profile } = useUser();
  const { t } = useLanguage();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isMobile = variant === 'mobile';

  return (
    <>
      <div className={`
        bg-gradient-to-r from-amber-50 to-orange-50
        border border-amber-200
        rounded-xl
        ${isMobile ? 'p-3' : 'p-4'}
      `}>
        <div className="flex flex-col gap-2">
          {/* 积分显示 */}
          <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <div className="flex items-center gap-1.5">
              <CreditsIcon className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} text-amber-600 flex-shrink-0`} />
              <span className="text-gray-700 font-medium">{t('creditInfo.currentCredits')}</span>
            </div>
            <span className="font-bold text-amber-700 text-base">
              {profile?.credits ?? 0}
            </span>

            {!user && (
              <button
                onClick={() => setShowLoginModal(true)}
                className="ml-auto text-red-600 hover:text-red-700 underline font-medium transition-colors"
              >
                {t('creditInfo.loginForMore')}
              </button>
            )}
          </div>

          {/* 分隔线 */}
          <div className="border-t border-amber-200" />

          {/* 扣费提示 */}
          <div className={`flex items-start gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <svg
              className={`${isMobile ? 'w-4 h-4' : 'w-4.5 h-4.5'} flex-shrink-0 text-amber-600 mt-0.5`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-amber-700">
              {t('creditInfo.deductionNotice', { actionName, count: creditCost })}
            </span>
          </div>
        </div>
      </div>

      {/* 登录模态框 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}