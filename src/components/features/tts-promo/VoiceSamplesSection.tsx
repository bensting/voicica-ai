'use client';

import { useRouter } from 'next/navigation';
import VoiceSelectorSection from './VoiceSelectorSection';

interface VoiceSamplesSectionProps {
  /** 默认语言 */
  defaultLanguage: string;
  /** 标题第一行 */
  title1: string;
  /** 标题第二行 */
  title2: string;
  /** 标题高亮部分 */
  titleHighlight: string;
  /** 描述文字 */
  description: string;
  /** 无语音时的提示 */
  emptyText: string;
  /** 探索全部按钮文字 */
  exploreAllText: string;
}

/**
 * Voice Samples Section - 语音样本区域
 * 包含标题、语音选择器、探索全部按钮
 */
export default function VoiceSamplesSection({
  defaultLanguage,
  title1,
  title2,
  titleHighlight,
  description,
  emptyText,
  exploreAllText,
}: VoiceSamplesSectionProps) {
  const router = useRouter();

  return (
    <section className="pt-4 pb-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section Header - Hidden on mobile */}
        <div className="hidden md:block text-center mb-4">
          <h2 className="text-3xl font-bold text-white mb-2">
            {title1}<br />
            {title2}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {titleHighlight}
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {/* Voice Selector */}
        <VoiceSelectorSection
          defaultLanguage={defaultLanguage}
          emptyText={emptyText}
        />

        {/* Explore All Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/studio/voices')}
            className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold text-sm hover:opacity-80 transition-opacity"
          >
            {exploreAllText} →
          </button>
        </div>
      </div>
    </section>
  );
}