'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import Stepper from '@/components/features/studio/ai-song/Stepper';
import OptionCard from '@/components/features/studio/ai-song/OptionCard';

// 步骤定义
const STEPS = [
  { id: 'theme', label: 'Theme' },
  { id: 'mood', label: 'Mood' },
  { id: 'vocal', label: 'Vocal' },
  { id: 'lyrics', label: 'Lyrics' },
  { id: 'generate', label: 'Create' },
];

// 选项数据
const THEME_OPTIONS = [
  { id: 'love', icon: '❤️', label: '爱情' },
  { id: 'friendship', icon: '🤝', label: '友情' },
  { id: 'youth', icon: '🌸', label: '青春' },
  { id: 'loneliness', icon: '🌙', label: '孤独' },
  { id: 'dream', icon: '✨', label: '梦想' },
  { id: 'freedom', icon: '🕊️', label: '自由' },
];

const MOOD_OPTIONS = [
  { id: 'gentle', icon: '❤️', label: '温柔' },
  { id: 'sad', icon: '💔', label: '伤感' },
  { id: 'night', icon: '🌃', label: '夜晚' },
  { id: 'passionate', icon: '🔥', label: '激情' },
  { id: 'ethereal', icon: '☁️', label: '空灵' },
  { id: 'healing', icon: '🌈', label: '治愈' },
];

const VOCAL_OPTIONS = [
  { id: 'female-ethereal', icon: '👩🏻‍🦰', label: '女声 · 空灵' },
  { id: 'female-gentle', icon: '👩🏻', label: '女声 · 温柔' },
  { id: 'male-warm', icon: '👨🏻', label: '男声 · 温暖' },
  { id: 'male-deep', icon: '👤', label: '男声 · 低沉' },
  { id: 'girl-sweet', icon: '👧🏻', label: '少女甜感' },
  { id: 'ambient', icon: '🌫️', label: '氛围人声' },
];

/**
 * AI Song Creation Page
 *
 * 分步骤创作 AI 音乐
 */
export default function AiSongPage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();
  const [currentStep, setCurrentStep] = useState(0);

  // 用户选择
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedVocal, setSelectedVocal] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string>('2min'); // 默认2分钟
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isGeneratingSong, setIsGeneratingSong] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    setTitle(t('studio.menu.aiSong'));
  }, [t, setTitle]);

  // 判断当前步骤是否可以继续
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedTheme !== null;
      case 1:
        return selectedMood !== null;
      case 2:
        return selectedVocal !== null;
      case 3:
        return lyrics.trim().length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      // 如果是从第3步（Vocal）进入第4步（Lyrics），自动生成歌词
      if (currentStep === 2) {
        handleGenerateLyrics();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerateLyrics = () => {
    setIsGeneratingLyrics(true);
    // 模拟 AI 生成歌词
    setTimeout(() => {
      setLyrics(
        `在夜晚的星空下\n我独自一人漫步\n思念如同潮水般涌来\n淹没了我的心\n\n你是否也在想我\n在远方的某个角落\n我们的回忆如此清晰\n却触不可及`
      );
      setIsGeneratingLyrics(false);
    }, 2000);
  };

  const handleGenerateSong = () => {
    setIsGeneratingSong(true);
    // 模拟生成歌曲
    setTimeout(() => {
      setGeneratedAudioUrl('https://example.com/song.mp3');
      setIsGeneratingSong(false);
    }, 3000);
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Theme
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                你想创作一首什么主题的歌？
              </h2>
              <p className="text-gray-600">选择一个主题，AI 会为你构建歌曲故事</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {THEME_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  icon={option.icon}
                  label={option.label}
                  selected={selectedTheme === option.id}
                  onClick={() => setSelectedTheme(option.id)}
                />
              ))}
            </div>
          </div>
        );

      case 1: // Mood
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                你想让这首歌是什么感觉？
              </h2>
              <p className="text-gray-600">选择一个情绪，我们会为你构建歌曲氛围</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MOOD_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  icon={option.icon}
                  label={option.label}
                  selected={selectedMood === option.id}
                  onClick={() => setSelectedMood(option.id)}
                />
              ))}
            </div>
          </div>
        );

      case 2: // Vocal
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                想让旋律更像哪种声音？
              </h2>
              <p className="text-gray-600">我们会用这个声线去塑造音乐氛围</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {VOCAL_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  icon={option.icon}
                  label={option.label}
                  selected={selectedVocal === option.id}
                  onClick={() => setSelectedVocal(option.id)}
                />
              ))}
            </div>
          </div>
        );

      case 3: // Lyrics
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {isGeneratingLyrics ? 'AI 正在为你创作歌词...' : '编辑你的歌词'}
              </h2>
              <p className="text-gray-600">
                {isGeneratingLyrics ? '请稍候，这可能需要几秒钟' : '不满意？可以点击重新生成'}
              </p>
            </div>

            {isGeneratingLyrics ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <Sparkles className="w-12 h-12 text-blue-500 animate-pulse" />
                  <p className="text-gray-600">正在生成歌词...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="歌词将在这里显示..."
                  className="w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                />
                <button
                  type="button"
                  onClick={handleGenerateLyrics}
                  className="w-full py-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors font-medium"
                >
                  🔄 重新生成歌词
                </button>
              </div>
            )}
          </div>
        );

      case 4: // Generate
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {isGeneratingSong
                  ? '正在为你创作歌曲...'
                  : generatedAudioUrl
                  ? '你的歌曲已生成！'
                  : '准备好创作了吗？'}
              </h2>
              <p className="text-gray-600">
                {isGeneratingSong
                  ? '请稍候，AI 正在根据你的选择创作音乐'
                  : generatedAudioUrl
                  ? '试听一下？不满意可以再生成一次'
                  : '检查你的选择，确认后开始生成'}
              </p>
            </div>

            {isGeneratingSong ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <Sparkles className="w-12 h-12 text-blue-500 animate-pulse" />
                  <p className="text-gray-600">正在创作中...</p>
                </div>
              </div>
            ) : generatedAudioUrl ? (
              <div className="space-y-4">
                {/* 音频播放器占位 */}
                <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <p className="text-gray-600">音频播放器（待实现）</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateSong}
                  className="w-full py-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors font-medium"
                >
                  🔄 重新生成歌曲
                </button>

                <button
                  type="button"
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-lg"
                >
                  🎬 继续制作 MV
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 预览选择 */}
                <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-gray-900 text-sm">你的创作配置</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Theme */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">主题：</span>
                      <span className="font-medium text-gray-900">
                        {THEME_OPTIONS.find(opt => opt.id === selectedTheme)?.icon}{' '}
                        {THEME_OPTIONS.find(opt => opt.id === selectedTheme)?.label}
                      </span>
                    </div>

                    {/* Mood */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">情绪：</span>
                      <span className="font-medium text-gray-900">
                        {MOOD_OPTIONS.find(opt => opt.id === selectedMood)?.icon}{' '}
                        {MOOD_OPTIONS.find(opt => opt.id === selectedMood)?.label}
                      </span>
                    </div>

                    {/* Vocal */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">声线：</span>
                      <span className="font-medium text-gray-900">
                        {VOCAL_OPTIONS.find(opt => opt.id === selectedVocal)?.icon}{' '}
                        {VOCAL_OPTIONS.find(opt => opt.id === selectedVocal)?.label}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">时长：</span>
                      <span className="font-medium text-gray-900">
                        {selectedDuration === '1min' && '⏱️ 1 分钟'}
                        {selectedDuration === '2min' && '⏱️ 2 分钟'}
                        {selectedDuration === '3min' && '⏱️ 3 分钟'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 时长选择 */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    歌曲时长
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: '1min', label: '1 分钟', icon: '⏱️' },
                      { id: '2min', label: '2 分钟', icon: '⏱️' },
                      { id: '3min', label: '3 分钟', icon: '⏱️' },
                    ].map((duration) => (
                      <button
                        key={duration.id}
                        type="button"
                        onClick={() => setSelectedDuration(duration.id)}
                        className={`
                          p-3 rounded-xl border-2 transition-all text-center
                          ${
                            selectedDuration === duration.id
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                          }
                        `}
                      >
                        <div className="text-xl mb-1">{duration.icon}</div>
                        <div className="text-sm font-medium">{duration.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 生成按钮 */}
                <button
                  type="button"
                  onClick={handleGenerateSong}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-lg flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  开始生成歌曲
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-gradient-to-b from-blue-50 to-white">
      {/* Stepper */}
      <Stepper steps={STEPS} currentStep={currentStep} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Step Content Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
            {renderStepContent()}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      {currentStep < 4 && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            {/* Previous Button */}
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                上一步
              </button>
            )}

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isGeneratingLyrics}
              className={`
                flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                ${
                  canProceed() && !isGeneratingLyrics
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              下一步
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Step 4 (Create) - Show Previous button only */}
      {currentStep === 4 && !generatedAudioUrl && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto">
            <button
              type="button"
              onClick={handlePrevious}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              上一步
            </button>
          </div>
        </div>
      )}
    </div>
  );
}