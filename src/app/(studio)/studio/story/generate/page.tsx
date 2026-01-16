'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Loader2, X, ChevronLeft, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';

interface StoryIdea {
  title: string;
  description: string;
}

interface GeneratedStory {
  title: string;
  content: string;
}

/**
 * Generate Story Page
 *
 * 两步流程：
 * 1. 输入关键词 → 获取故事创意
 * 2. 选择创意 → 生成完整故事 → 编辑保存
 */
export default function GenerateStoryPage() {
  const { t, locale } = useLanguage();
  const { setTitle } = useStudio();

  // 步骤状态
  const [step, setStep] = useState<'input' | 'ideas'>('input');

  // 第一步：输入关键词
  const [keywords, setKeywords] = useState('');
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [ideas, setIdeas] = useState<StoryIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<StoryIdea | null>(null);

  // 第二步：生成完整故事
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  // 编辑弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 错误状态
  const [error, setError] = useState<string | null>(null);

  // 设置页面标题
  useEffect(() => {
    setTitle(t('story.generateTitle') || 'Generate Story');
  }, [t, setTitle]);

  // 获取故事创意
  const handleGetIdeas = async () => {
    setIsLoadingIdeas(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/story/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywords.trim() || undefined,
          locale, // 传递当前网页语言
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get story ideas');
      }

      setIdeas(data.ideas);
      setStep('ideas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get story ideas');
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  // 选择创意（不直接生成）
  const handleSelectIdea = (idea: StoryIdea) => {
    setSelectedIdea(idea);
    setError(null);
  };

  // 生成完整故事
  const handleGenerateStory = async () => {
    if (!selectedIdea) return;

    setIsGeneratingStory(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedIdea.title,
          description: selectedIdea.description,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate story');
      }

      setGeneratedTitle(data.story.title);
      setGeneratedContent(data.story.content);
      setIsModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate story');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // 返回第一步
  const handleBack = () => {
    setStep('input');
    setIdeas([]);
    setSelectedIdea(null);
  };

  // 保存故事
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // TODO: 调用保存 API
      console.log('Saving story:', { title: generatedTitle, content: generatedContent });

      // 模拟保存
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 关闭弹窗并重置
      setIsModalOpen(false);
      setKeywords('');
      setStep('input');
      setIdeas([]);
      setSelectedIdea(null);

      // TODO: 可以跳转到 My Stories 页面或显示成功提示
    } catch (err) {
      console.error('Failed to save story:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedIdea(null);
  };

  const canGetIdeas = !isLoadingIdeas;

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden fixed inset-0 flex flex-col bg-gradient-to-b from-gray-50 to-white" style={{ top: 'calc(60px + var(--safe-area-inset-top, 0px))' }}>
        <div className="flex-1 flex flex-col px-4 pt-4 gap-4 overflow-hidden pb-3">
          {step === 'input' ? (
            <>
              {/* Keywords Input */}
              <div className="flex-1 min-h-0">
                <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <textarea
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    disabled={isLoadingIdeas}
                    placeholder={t('story.keywordsPlaceholder') || 'Enter keywords (optional)... e.g., little monk, dragon, forest'}
                    className="w-full h-full p-4 text-base text-gray-700 placeholder-gray-400 bg-white border-0 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Get Ideas Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleGetIdeas}
                  disabled={!canGetIdeas}
                  className={`
                    w-full py-4 rounded-2xl font-semibold text-lg transition-all
                    flex items-center justify-center gap-2
                    ${canGetIdeas
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isLoadingIdeas ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('story.gettingIdeas') || 'Getting ideas...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>{t('story.getIdeas') || 'Get Story Ideas'}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Back Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleBack}
                  disabled={isGeneratingStory}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>{t('story.backToInput') || 'Back'}</span>
                </button>
              </div>

              {/* Ideas Title */}
              <div className="flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('story.selectIdea') || 'Select a story idea'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t('story.selectIdeaDesc') || 'Choose one to generate the full story'}
                </p>
              </div>

              {/* Ideas List */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
                {ideas.map((idea, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectIdea(idea)}
                    disabled={isGeneratingStory}
                    className={`
                      w-full p-4 bg-white rounded-xl border-2 text-left transition-all
                      ${selectedIdea === idea
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${selectedIdea === idea
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'
                        }
                      `}>
                        {selectedIdea === idea && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{idea.title}</h3>
                        <p className="text-sm text-gray-600">{idea.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex-shrink-0 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Generate Story Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleGenerateStory}
                  disabled={!selectedIdea || isGeneratingStory}
                  className={`
                    w-full py-4 rounded-2xl font-semibold text-lg transition-all
                    flex items-center justify-center gap-2
                    ${selectedIdea && !isGeneratingStory
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isGeneratingStory ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('story.generating') || 'Generating...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>{t('story.generate') || 'Generate Story'}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* 底部导航栏占位空间 */}
        <div className="h-[64px] flex-shrink-0" style={{ height: 'calc(64px + var(--safe-area-inset-bottom, 0px))' }} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-col bg-gradient-to-b from-white to-purple-50 lg:h-[calc(100vh-60px)] overflow-hidden">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col min-h-0">
          {step === 'input' ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {t('story.generateTitle') || 'Generate Story'}
                </h1>
                <p className="text-gray-500">
                  {t('story.generateSubtitle') || 'Enter keywords to get story ideas'}
                </p>
              </div>

              {/* Keywords Input Card */}
              <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  disabled={isLoadingIdeas}
                  placeholder={t('story.keywordsPlaceholder') || 'Enter keywords (optional)... e.g., little monk, dragon, forest'}
                  className="w-full h-full p-6 text-lg text-gray-700 placeholder-gray-400 bg-white border-0 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Get Ideas Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleGetIdeas}
                  disabled={!canGetIdeas}
                  className={`
                    w-full py-4 rounded-2xl font-semibold text-lg transition-all
                    flex items-center justify-center gap-2
                    ${canGetIdeas
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isLoadingIdeas ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('story.gettingIdeas') || 'Getting ideas...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>{t('story.getIdeas') || 'Get Story Ideas'}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Back Button & Header */}
              <div className="mb-6">
                <button
                  onClick={handleBack}
                  disabled={isGeneratingStory}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors mb-4 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>{t('story.backToInput') || 'Back'}</span>
                </button>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('story.selectIdea') || 'Select a story idea'}
                </h2>
                <p className="text-gray-500 mt-1">
                  {t('story.selectIdeaDesc') || 'Choose one to generate the full story'}
                </p>
              </div>

              {/* Ideas Grid */}
              <div className="flex-1 min-h-0 overflow-y-auto mb-6">
                <div className="grid grid-cols-2 gap-4">
                  {ideas.map((idea, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectIdea(idea)}
                      disabled={isGeneratingStory}
                      className={`
                        p-5 bg-white rounded-xl border-2 text-left transition-all
                        ${selectedIdea === idea
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5
                          ${selectedIdea === idea
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                          }
                        `}>
                          {selectedIdea === idea && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-2">{idea.title}</h3>
                          <p className="text-sm text-gray-600">{idea.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Generate Story Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleGenerateStory}
                  disabled={!selectedIdea || isGeneratingStory}
                  className={`
                    w-full py-4 rounded-2xl font-semibold text-lg transition-all
                    flex items-center justify-center gap-2
                    ${selectedIdea && !isGeneratingStory
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isGeneratingStory ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('story.generating') || 'Generating...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>{t('story.generate') || 'Generate Story'}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Story Modal */}
      {isModalOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {t('story.editStory') || 'Edit Story'}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('story.titleLabel') || 'Title'}
                </label>
                <input
                  type="text"
                  value={generatedTitle}
                  onChange={(e) => setGeneratedTitle(e.target.value)}
                  className="w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={t('story.titlePlaceholder') || 'Enter story title...'}
                />
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('story.contentLabel') || 'Content'}
                </label>
                <textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 text-base text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none leading-relaxed"
                  placeholder={t('story.contentPlaceholder') || 'Story content...'}
                />
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-6 py-2.5 text-gray-700 font-medium bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !generatedTitle.trim() || !generatedContent.trim()}
                className="px-6 py-2.5 text-white font-medium bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('common.saving') || 'Saving...'}</span>
                  </>
                ) : (
                  <span>{t('common.save') || 'Save'}</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
