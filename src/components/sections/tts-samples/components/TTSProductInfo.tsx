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

      {/* CTA Button and Stats - 横向布局 */}
      <div>
        <div className="flex items-center gap-4 mb-3">
          {/* 按钮 */}
          <GradientButton size="lg">{t('ttsSamples.productInfo.cta.button')}</GradientButton>

          {/* 星星和统计数据 */}
          <div className="flex flex-col gap-1">
            {/* 星星评分 */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            {/* 统计数字 */}
            <div className="text-gray-300">
              <span className="font-bold text-white">1M+</span>
              <div className="text-sm text-gray-400">{t('ttsSamples.productInfo.cta.conversions')}</div>
            </div>
          </div>
        </div>

        {/* 使用人数 */}
        <div className="text-sm text-gray-400">{t('ttsSamples.productInfo.cta.usersCount')}</div>
      </div>
    </div>
  );
}