'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import Stepper from '@/components/features/studio/ai-song/Stepper';
import OptionCard from '@/components/features/studio/ai-song/OptionCard';
import LyricsEditor from '@/components/features/studio/ai-song/LyricsEditor';
import CreatePreview from '@/components/features/studio/ai-song/CreatePreview';
import LoginModal from '@/components/features/auth/LoginModal';
import { createMusicTask, getMusicTaskStatus } from '@/actions/music';
import { getMusicModelCredits } from '@/config/native/musicModels';

// 选项 ID 定义
const THEME_IDS = ['love', 'friendship', 'youth', 'loneliness', 'dream', 'freedom', 'custom'] as const;
const MOOD_IDS = ['gentle', 'sad', 'night', 'passionate', 'ethereal', 'healing', 'custom'] as const;
const VOCAL_IDS = ['female-ethereal', 'female-gentle', 'male-warm', 'male-deep', 'girl-sweet', 'ambient'] as const;

// 选项图标
const THEME_ICONS: Record<string, string> = {
  love: '❤️',
  friendship: '🤝',
  youth: '🌸',
  loneliness: '🌙',
  dream: '✨',
  freedom: '🕊️',
  custom: '✏️',
};

const MOOD_ICONS: Record<string, string> = {
  gentle: '❤️',
  sad: '💔',
  night: '🌃',
  passionate: '🔥',
  ethereal: '☁️',
  healing: '🌈',
  custom: '✏️',
};

const VOCAL_ICONS: Record<string, string> = {
  'female-ethereal': '👩🏻‍🦰',
  'female-gentle': '👩🏻',
  'male-warm': '👨🏻',
  'male-deep': '👤',
  'girl-sweet': '👧🏻',
  'ambient': '🌫️',
};

// 声线 ID 到翻译 key 的映射
const VOCAL_TRANSLATION_KEYS: Record<string, string> = {
  'female-ethereal': 'femaleEthereal',
  'female-gentle': 'femaleGentle',
  'male-warm': 'maleWarm',
  'male-deep': 'maleDeep',
  'girl-sweet': 'girlSweet',
  'ambient': 'ambient',
};

/**
 * AI Song Creation Page
 *
 * 分步骤创作 AI 音乐
 */
export default function AiSongPage() {
  const { t } = useLanguage();
  const { setTitle } = useStudio();
  const { credits } = useCredits();
  const { user } = useFirebaseAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 积分相关
  const creditsRequired = getMusicModelCredits('music-4.5');

  // 用户选择
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customTheme, setCustomTheme] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [customMood, setCustomMood] = useState('');
  const [selectedVocal, setSelectedVocal] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [songStyle, setSongStyle] = useState('');
  const [vocalGender, setVocalGender] = useState<'' | 'm' | 'f'>('');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);
  const [isGeneratingSong, setIsGeneratingSong] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedAudioUrl2, setGeneratedAudioUrl2] = useState<string | null>(null);
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string | null>(null);
  const [generatedCoverUrl2, setGeneratedCoverUrl2] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState<string | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [, setCurrentTaskId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 使用 useMemo 构建带翻译的选项
  const STEPS = useMemo(() => [
    { id: 'theme', label: t('studio.aiSong.steps.theme') },
    { id: 'mood', label: t('studio.aiSong.steps.mood') },
    { id: 'vocal', label: t('studio.aiSong.steps.vocal') },
    { id: 'lyrics', label: t('studio.aiSong.steps.lyrics') },
    { id: 'generate', label: t('studio.aiSong.steps.create') },
  ], [t]);

  const THEME_OPTIONS = useMemo(() => THEME_IDS.map(id => ({
    id,
    icon: THEME_ICONS[id],
    label: t(`studio.aiSong.themes.${id}`),
  })), [t]);

  const MOOD_OPTIONS = useMemo(() => MOOD_IDS.map(id => ({
    id,
    icon: MOOD_ICONS[id],
    label: t(`studio.aiSong.moods.${id}`),
  })), [t]);

  const VOCAL_OPTIONS = useMemo(() => VOCAL_IDS.map(id => ({
    id,
    icon: VOCAL_ICONS[id],
    label: t(`studio.aiSong.vocals.${VOCAL_TRANSLATION_KEYS[id]}`),
  })), [t]);

  // 获取实际的主题文本（用于 API 调用）
  const getThemeText = () => {
    if (selectedTheme === 'custom') {
      return customTheme.trim();
    }
    const option = THEME_OPTIONS.find(opt => opt.id === selectedTheme);
    return option?.label || '';
  };

  useEffect(() => {
    setTitle(t('studio.menu.aiSong'));
  }, [t, setTitle]);

  // 根据选择的声线自动设置声音性别
  useEffect(() => {
    if (selectedVocal) {
      if (selectedVocal.includes('female') || selectedVocal.includes('girl')) {
        setVocalGender('f');
      } else if (selectedVocal.includes('male')) {
        setVocalGender('m');
      }
    }
  }, [selectedVocal]);

  // 判断当前步骤是否可以继续
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        if (selectedTheme === 'custom') {
          return customTheme.trim().length > 0;
        }
        return selectedTheme !== null;
      case 1:
        if (selectedMood === 'custom') {
          return customMood.trim().length > 0;
        }
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
    // 检查用户是否登录
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (currentStep < STEPS.length - 1 && canProceed()) {
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

  // 获取心情文本
  const getMoodText = () => {
    if (selectedMood === 'custom') {
      return customMood.trim();
    }
    const option = MOOD_OPTIONS.find(opt => opt.id === selectedMood);
    return option?.label || '';
  };

  // 获取声线文本
  const getVocalText = () => {
    const option = VOCAL_OPTIONS.find(opt => opt.id === selectedVocal);
    return option?.label || '';
  };

  // 获取声音性别
  const getVocalGender = (): 'm' | 'f' => {
    if (selectedVocal?.includes('female') || selectedVocal?.includes('girl')) {
      return 'f';
    }
    return 'm';
  };

  const handleGenerateLyrics = async () => {
    setIsGeneratingLyrics(true);

    const theme = getThemeText();
    const mood = getMoodText();
    const vocal = getVocalText();

    // 使用翻译的提示词模板
    const prompt = t('studio.aiSong.lyricsPrompt', { theme, mood, vocal });

    try {
      const response = await fetch('/api/ai/generate-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data.success && data.lyrics) {
        setLyrics(data.lyrics);
        if (data.title) {
          setSongTitle(data.title);
        }
      } else {
        console.warn('Lyrics generation failed, using fallback:', data.error);
        setSongTitle(t('studio.aiSong.fallbackTitle', { theme }));
        setLyrics(
          `[Verse 1]\nUnder the starry night sky\nI walk alone in thought\nMemories flood like the tide\nOverwhelming my heart\n\n[Chorus]\nThe story of ${theme} echoes within\n${mood} melodies softly sing\n\n[Verse 2]\nAre you thinking of me too\nSomewhere far away\nOur memories so vivid\nYet beyond my reach\n\n[Chorus]\nThe story of ${theme} echoes within\n${mood} melodies softly sing`
        );
      }
    } catch (error) {
      console.error('Lyrics generation request failed:', error);
      setSongTitle(t('studio.aiSong.fallbackTitle', { theme }));
      setLyrics(
        `[Verse 1]\nUnder the starry night sky\nI walk alone in thought\nMemories flood like the tide\nOverwhelming my heart\n\n[Chorus]\nThe story of ${theme} echoes within\n${mood} melodies softly sing\n\n[Verse 2]\nAre you thinking of me too\nSomewhere far away\nOur memories so vivid\nYet beyond my reach\n\n[Chorus]\nThe story of ${theme} echoes within\n${mood} melodies softly sing`
      );
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    try {
      const status = await getMusicTaskStatus(taskId);
      console.log('🎵 [pollTaskStatus]', status);

      if (status.status === 'SUCCESS' && status.result) {
        setGeneratedAudioUrl(status.result.audio_url || null);
        setGeneratedAudioUrl2(status.result.audio_url_2 || null);
        setGeneratedCoverUrl(status.result.cover_url || null);
        setGeneratedCoverUrl2(status.result.cover_url_2 || null);
        setGeneratedTitle(status.result.title || null);
        setGeneratedLyrics(status.result.lyrics || null);
        setIsGeneratingSong(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else if (status.status === 'FAILURE') {
        console.error('🎵 Generation failed:', status.error);
        setIsGeneratingSong(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        alert(status.error || 'Generation failed, please try again');
      }
    } catch (error) {
      console.error('🎵 Polling failed:', error);
    }
  };

  // 生成音乐风格
  const handleGenerateStyle = async () => {
    setIsGeneratingStyle(true);
    try {
      const theme = getThemeText();
      const mood = getMoodText();
      const vocal = getVocalText();

      const response = await fetch('/api/ai/generate-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Theme: ${theme}, Mood: ${mood}, Vocal: ${vocal}`,
        }),
      });

      const data = await response.json();
      if (data.success && data.style) {
        setSongStyle(data.style);
      }
    } catch (error) {
      console.error('Style generation failed:', error);
    } finally {
      setIsGeneratingStyle(false);
    }
  };

  const handleGenerateSong = async () => {
    setIsGeneratingSong(true);
    setGeneratedAudioUrl(null);
    setGeneratedAudioUrl2(null);
    setGeneratedCoverUrl(null);
    setGeneratedCoverUrl2(null);
    setGeneratedTitle(null);
    setGeneratedLyrics(null);

    try {
      const theme = getThemeText();
      const mood = getMoodText();
      const vocal = getVocalText();

      const finalStyle = songStyle.trim() || `${mood}, ${vocal}`;
      const finalTitle = songTitle.trim() || t('studio.aiSong.fallbackTitle', { theme });
      const finalVocalGender = vocalGender || getVocalGender();

      const result = await createMusicTask({
        prompt: lyrics,
        model: 'music-4.5',
        customMode: true,
        style: finalStyle,
        title: finalTitle,
        instrumental: false,
        vocalGender: finalVocalGender,
        isPublic: false,
      });

      if (result.status === 'FAILURE') {
        throw new Error(result.error || 'Failed to create task');
      }

      setCurrentTaskId(result.task_id);

      pollingRef.current = setInterval(() => {
        pollTaskStatus(result.task_id);
      }, 5000);

      await pollTaskStatus(result.task_id);
    } catch (error) {
      console.error('🎵 Task creation failed:', error);
      setIsGeneratingSong(false);
      alert(error instanceof Error ? error.message : 'Failed to create task, please try again');
    }
  };

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Theme
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {t('studio.aiSong.themeStep.title')}
              </h2>
              <p className="text-gray-600">{t('studio.aiSong.themeStep.subtitle')}</p>
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

            {selectedTheme === 'custom' && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('studio.aiSong.themeStep.customLabel')}
                </label>
                <div className="relative">
                  <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder={t('studio.aiSong.themeStep.customPlaceholder')}
                    className="w-full pl-10 pr-4 py-3 border-2 border-pink-300 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                    maxLength={50}
                  />
                </div>
                <p className="text-xs text-gray-500 text-right">{customTheme.length}/50</p>
              </div>
            )}
          </div>
        );

      case 1: // Mood
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {t('studio.aiSong.moodStep.title')}
              </h2>
              <p className="text-gray-600">{t('studio.aiSong.moodStep.subtitle')}</p>
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

            {selectedMood === 'custom' && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('studio.aiSong.moodStep.customLabel')}
                </label>
                <div className="relative">
                  <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customMood}
                    onChange={(e) => setCustomMood(e.target.value)}
                    placeholder={t('studio.aiSong.moodStep.customPlaceholder')}
                    className="w-full pl-10 pr-4 py-3 border-2 border-pink-300 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                    maxLength={50}
                  />
                </div>
                <p className="text-xs text-gray-500 text-right">{customMood.length}/50</p>
              </div>
            )}
          </div>
        );

      case 2: // Vocal
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {t('studio.aiSong.vocalStep.title')}
              </h2>
              <p className="text-gray-600">{t('studio.aiSong.vocalStep.subtitle')}</p>
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
        const lyricsTheme = selectedTheme === 'custom'
          ? { icon: '✏️', label: customTheme }
          : THEME_OPTIONS.find(opt => opt.id === selectedTheme);
        const lyricsMood = selectedMood === 'custom'
          ? { icon: '✏️', label: customMood }
          : MOOD_OPTIONS.find(opt => opt.id === selectedMood);
        const lyricsVocal = VOCAL_OPTIONS.find(opt => opt.id === selectedVocal);

        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {isGeneratingLyrics
                  ? t('studio.aiSong.lyricsStep.titleGenerating')
                  : t('studio.aiSong.lyricsStep.title')}
              </h2>
              <p className="text-gray-600">
                {isGeneratingLyrics
                  ? t('studio.aiSong.lyricsStep.subtitleGenerating')
                  : t('studio.aiSong.lyricsStep.subtitle')}
              </p>
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-fuchsia-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">{t('studio.aiSong.lyricsStep.basedOnSelection')}</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
                  {lyricsTheme?.icon} {lyricsTheme?.label}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
                  {lyricsMood?.icon} {lyricsMood?.label}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm">
                  {lyricsVocal?.icon} {lyricsVocal?.label}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('studio.aiSong.lyricsStep.songTitleLabel')}
              </label>
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder={isGeneratingLyrics
                  ? t('studio.aiSong.lyricsStep.songTitleGenerating')
                  : t('studio.aiSong.lyricsStep.songTitlePlaceholder')}
                disabled={isGeneratingLyrics}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all disabled:bg-gray-50 disabled:text-gray-400"
                maxLength={50}
              />
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
        const displayTheme = selectedTheme === 'custom'
          ? { id: 'custom', icon: '✏️', label: customTheme }
          : THEME_OPTIONS.find(opt => opt.id === selectedTheme);

        const displayMood = selectedMood === 'custom'
          ? { id: 'custom', icon: '✏️', label: customMood }
          : MOOD_OPTIONS.find(opt => opt.id === selectedMood);

        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {isGeneratingSong
                  ? t('studio.aiSong.createStep.titleGenerating')
                  : generatedAudioUrl
                  ? t('studio.aiSong.createStep.titleComplete')
                  : t('studio.aiSong.createStep.title')}
              </h2>
              <p className="text-gray-600">
                {isGeneratingSong
                  ? t('studio.aiSong.createStep.subtitleGenerating')
                  : generatedAudioUrl
                  ? t('studio.aiSong.createStep.subtitleComplete')
                  : t('studio.aiSong.createStep.subtitle')}
              </p>
            </div>

            <CreatePreview
              theme={displayTheme}
              mood={displayMood}
              vocal={VOCAL_OPTIONS.find(opt => opt.id === selectedVocal)}
              lyrics={lyrics}
              style={songStyle}
              title={songTitle}
              vocalGender={vocalGender}
              onStyleChange={setSongStyle}
              onTitleChange={setSongTitle}
              onVocalGenderChange={setVocalGender}
              onGenerateStyle={handleGenerateStyle}
              isGeneratingStyle={isGeneratingStyle}
              creditsRequired={creditsRequired}
              userCredits={credits}
              isGenerating={isGeneratingSong}
              generatedAudioUrl={generatedAudioUrl}
              generatedAudioUrl2={generatedAudioUrl2}
              generatedCoverUrl={generatedCoverUrl}
              generatedCoverUrl2={generatedCoverUrl2}
              generatedTitle={generatedTitle}
              generatedLyrics={generatedLyrics}
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
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                {t('studio.aiSong.navigation.previous')}
              </button>
            )}

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
              {t('studio.aiSong.navigation.next')}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Step 4 (Create) */}
      {currentStep === 4 && !generatedAudioUrl && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto">
            <button
              type="button"
              onClick={handlePrevious}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              {t('studio.aiSong.navigation.previous')}
            </button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
