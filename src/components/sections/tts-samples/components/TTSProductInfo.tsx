import { Mic, Star } from 'lucide-react';
import { GradientButton } from '@/components/ui';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * TTS Product Info Component
 * 展示产品信息、功能列表和统计数据
 */
export default function TTSProductInfo() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col justify-between">
      {/* Icon and Title */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Mic className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white">{t('ttsSamples.productInfo.title')}</h3>
        </div>

        <h4 className="text-3xl font-bold text-white mb-6">
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

      {/* CTA Button and Stats - 响应式布局 */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {/* 按钮 - 移动端缩小内边距 */}
          <div className="w-full sm:w-auto">
            <GradientButton size="lg" className="px-6 sm:px-8 whitespace-nowrap">
              {t('ttsSamples.productInfo.cta.button')}
            </GradientButton>
          </div>

          {/* 右侧统计数据区域 */}
          <div className="flex flex-col gap-1">
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