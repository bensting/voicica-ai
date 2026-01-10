'use client';

import { useRouter } from 'next/navigation';
import { Mic, Download, Sparkles, Globe, Check } from 'lucide-react';
import { GradientButton } from '@/components/ui';

interface TTSCTASectionProps {
  /** Feature 1: 语音数量 */
  feature1: string;
  /** Feature 2: 下载格式 */
  feature2: string;
  /** Feature 3: 克隆语音 */
  feature3: string;
  /** Feature 4: 免费 */
  feature4: string;
  /** 开始创建按钮文字 */
  startCreatingText: string;
  /** 无需信用卡文字 */
  noCreditCardText: string;
  /** 无需注册文字 */
  noSignupText: string;
}

/**
 * TTS CTA Section - 行动号召区域
 * 包含功能特点列表、CTA按钮、底部提示
 */
export default function TTSCTASection({
  feature1,
  feature2,
  feature3,
  feature4,
  startCreatingText,
  noCreditCardText,
  noSignupText,
}: TTSCTASectionProps) {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/studio/tts');
  };

  return (
    <section className="py-8 px-4 bg-gradient-to-t from-purple-900/30 to-transparent">
      <div className="max-w-4xl mx-auto text-center">
        {/* Features - 2x2 grid on mobile, inline on desktop */}
        <div className="grid grid-cols-2 md:flex md:justify-center gap-3 md:gap-6 mb-6">
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Globe className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>{feature1}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Download className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>{feature2}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Mic className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>{feature3}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-green-400 font-medium">{feature4}</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <GradientButton
            size="lg"
            className="min-w-[280px] py-5 text-lg"
            onClick={handleGetStarted}
          >
            <Sparkles className="w-6 h-6 mr-2" />
            {startCreatingText}
          </GradientButton>
        </div>

        <p className="mt-4 text-gray-500 text-sm">
          {noCreditCardText} • {noSignupText}
        </p>
      </div>
    </section>
  );
}