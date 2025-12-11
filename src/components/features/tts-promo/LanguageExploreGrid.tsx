'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export interface LanguageCardItem {
  code: string;
  name: string;
  flag: string;
  href: string;
}

interface LanguageExploreGridProps {
  title: string;
  subtitle: string;
  languages: LanguageCardItem[];
  exploreMoreText: string;
  exploreMoreHref: string;
  /** Current page's language code - will be excluded from the grid */
  currentLanguage?: string;
}

/**
 * Language Explore Grid - 语言探索网格
 *
 * 用于 TTS 落地页底部，展示支持的语言并链接到各语言专属页面
 * - 点击语言卡片跳转到对应落地页
 * - "Explore More" 跳转到 Studio TTS 页面
 */
export default function LanguageExploreGrid({
  title,
  subtitle,
  languages,
  exploreMoreText,
  exploreMoreHref,
  currentLanguage,
}: LanguageExploreGridProps) {
  const router = useRouter();

  // Filter out current language
  const filteredLanguages = currentLanguage
    ? languages.filter(lang => lang.code !== currentLanguage)
    : languages;

  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {title}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
            {subtitle}
          </p>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {filteredLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => router.push(lang.href)}
              className="group flex items-center gap-3 bg-gray-900/60 hover:bg-gray-800/80 border border-gray-700/50 hover:border-purple-500/50 rounded-xl px-4 py-3 transition-all"
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="flex-1 text-left text-sm text-gray-300 group-hover:text-white transition-colors">
                {lang.name}
              </span>
              <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
            </button>
          ))}
        </div>

        {/* Explore More Button */}
        <div className="text-center">
          <button
            onClick={() => router.push(exploreMoreHref)}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-full transition-colors"
          >
            {exploreMoreText}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}