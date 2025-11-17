'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Stepper from '@/components/features/studio/ai-song/Stepper';
import OptionCard from '@/components/features/studio/ai-song/OptionCard';
import LyricsEditor from '@/components/features/studio/ai-song/LyricsEditor';
import CreatePreview from '@/components/features/studio/ai-song/CreatePreview';

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

            <LyricsEditor
              lyrics={lyrics}
              onLyricsChange={setLyrics}
              onRegenerate={handleGenerateLyrics}
              isGenerating={isGeneratingLyrics}
            />
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

            <CreatePreview
              theme={THEME_OPTIONS.find(opt => opt.id === selectedTheme)}
              mood={MOOD_OPTIONS.find(opt => opt.id === selectedMood)}
              vocal={VOCAL_OPTIONS.find(opt => opt.id === selectedVocal)}
              duration={selectedDuration}
              lyrics={lyrics}
              onDurationChange={setSelectedDuration}
              isGenerating={isGeneratingSong}
              generatedAudioUrl={generatedAudioUrl}
              onGenerate={handleGenerateSong}
              onRegenerate={handleGenerateSong}
              onContinueToMV={() => console.log('Continue to MV')}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-gradient-to-b from-pink-50 to-white">
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
                    ? 'bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600'
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