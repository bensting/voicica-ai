import { useRouter } from 'next/navigation';
import { Mic, Star } from 'lucide-react';
import { GradientButton } from '@/components/ui';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * TTS Product Info Component
 * 展示产品信息、功能列表和统计数据
 */
export default function TTSProductInfo() {
  const { t } = useLanguage();
  const router = useRouter();

  // Navigate to TTS page
  const handleTryNow = () => {
    router.push('/studio/tts');
  };

  return (
    <div className="flex flex-col justify-between">
      {/* Icon and Title */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">{t('ttsSamples.productInfo.title')}</h3>
        </div>

        <h4 className="text-lg md:text-xl font-bold text-white mb-5 leading-snug">
          {t('ttsSamples.productInfo.headline.prefix')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {t('ttsSamples.productInfo.headline.highlight')}
          </span>{' '}
          {t('ttsSamples.productInfo.headline.suffix')}
        </h4>

        {/* Features List */}
        <ul className="space-y-3 mb-8 text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-1">•</span>
            <span>{t('ttsSamples.productInfo.features.voices')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-1">•</span>
            <span>{t('ttsSamples.productInfo.features.natural')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-1">•</span>
            <span>{t('ttsSamples.productInfo.features.parameters')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-1">•</span>
            <span>{t('ttsSamples.productInfo.features.download')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-1">•</span>
            <span>{t('ttsSamples.productInfo.features.voiceover')}</span>
          </li>
        </ul>
      </div>

      {/* CTA Button and Stats - 横向布局（移动端和桌面端均为横向） */}
      <div>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* 按钮 - 移动端缩小 */}
          <div className="flex-shrink-0">
            <GradientButton
              size="lg"
              className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base whitespace-nowrap"
              onClick={handleTryNow}
            >
              {t('ttsSamples.productInfo.cta.button')}
            </GradientButton>
          </div>

          {/* 右侧统计数据区域 */}
          <div className="flex flex-col gap-1 flex-1">
            {/* 星星评分 */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>

            {/* 统计数字 - 1M+ 和 次语音转换在同一行 */}
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-white">1M+</span>{' '}
              <span className="text-gray-400">{t('ttsSamples.productInfo.cta.conversions')}</span>
            </div>

            {/* 使用人数 */}
            <div className="text-xs sm:text-sm text-gray-400">{t('ttsSamples.productInfo.cta.usersCount')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}