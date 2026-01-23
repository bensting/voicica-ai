'use client';

import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudio } from '@/contexts/StudioContext';
import { useCredits } from '@/contexts/CreditsContext';
import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import Stepper from '@/components/features/studio/ai-song/Stepper';
import OptionCard from '@/components/features/studio/ai-song/OptionCard';
import LyricsEditor from '@/components/features/studio/ai-song/LyricsEditor';
import CreatePreview from '@/components/features/studio/ai-song/CreatePreview';
import { createMusicTask, getMusicTaskStatus } from '@/actions/music';
import { getMusicModelCredits } from '@/config/native/musicModels';

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
  { id: 'custom', icon: '✏️', label: '自己输入' },
];

const MOOD_OPTIONS = [
  { id: 'gentle', icon: '❤️', label: '温柔' },
  { id: 'sad', icon: '💔', label: '伤感' },
  { id: 'night', icon: '🌃', label: '夜晚' },
  { id: 'passionate', icon: '🔥', label: '激情' },
  { id: 'ethereal', icon: '☁️', label: '空灵' },
  { id: 'healing', icon: '🌈', label: '治愈' },
  { id: 'custom', icon: '✏️', label: '自己输入' },
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
  const { credits } = useCredits();
  const [currentStep, setCurrentStep] = useState(0);

  // 积分相关
  const creditsRequired = getMusicModelCredits('music-4.5'); // 使用默认模型的积分

  // 用户选择
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customTheme, setCustomTheme] = useState(''); // 自定义主题文本
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [customMood, setCustomMood] = useState(''); // 自定义情绪文本
  const [selectedVocal, setSelectedVocal] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [songTitle, setSongTitle] = useState(''); // 歌曲标题
  const [songStyle, setSongStyle] = useState(''); // 音乐风格
  const [vocalGender, setVocalGender] = useState<'' | 'm' | 'f'>(''); // 声音性别
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);
  const [isGeneratingSong, setIsGeneratingSong] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedAudioUrl2, setGeneratedAudioUrl2] = useState<string | null>(null);
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string | null>(null);
  const [generatedCoverUrl2, setGeneratedCoverUrl2] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState<string | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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

  // 判断当前步骤是否可以继续
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        // 如果选择了自定义主题，需要输入内容
        if (selectedTheme === 'custom') {
          return customTheme.trim().length > 0;
        }
        return selectedTheme !== null;
      case 1:
        // 如果选择了自定义情绪，需要输入内容
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

    // 获取用户选择
    const theme = getThemeText();
    const mood = getMoodText();
    const vocal = getVocalText();

    // 构建详细的提示词
    const prompt = `请为一首中文歌曲创作歌词。
主题：${theme}
情绪氛围：${mood}
演唱声线：${vocal}

要求：
1. 歌词需要包含 [Verse 1]、[Chorus]、[Verse 2] 等结构标记
2. 歌词要符合主题和情绪，适合演唱
3. 语言优美，有意境
4. 长度适中，大约 150-200 字`;

    try {
      const response = await fetch('/api/ai/generate-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data.success && data.lyrics) {
        setLyrics(data.lyrics);
      } else {
        // 如果 API 失败，使用备用歌词
        console.warn('歌词生成失败，使用备用歌词:', data.error);
        setLyrics(
          `[Verse 1]\n在夜晚的星空下\n我独自一人漫步\n思念如同潮水般涌来\n淹没了我的心\n\n[Chorus]\n${theme}的故事在心中回响\n${mood}的旋律轻轻唱\n\n[Verse 2]\n你是否也在想我\n在远方的某个角落\n我们的回忆如此清晰\n却触不可及\n\n[Chorus]\n${theme}的故事在心中回响\n${mood}的旋律轻轻唱`
        );
      }
    } catch (error) {
      console.error('歌词生成请求失败:', error);
      // 使用备用歌词
      setLyrics(
        `[Verse 1]\n在夜晚的星空下\n我独自一人漫步\n思念如同潮水般涌来\n淹没了我的心\n\n[Chorus]\n${theme}的故事在心中回响\n${mood}的旋律轻轻唱\n\n[Verse 2]\n你是否也在想我\n在远方的某个角落\n我们的回忆如此清晰\n却触不可及\n\n[Chorus]\n${theme}的故事在心中回响\n${mood}的旋律轻轻唱`
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
        // 生成成功 - 保存两个版本
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
        // 生成失败
        console.error('🎵 生成失败:', status.error);
        setIsGeneratingSong(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        alert(status.error || '生成失败，请重试');
      }
      // PENDING/PROCESSING 状态继续轮询
    } catch (error) {
      console.error('🎵 轮询失败:', error);
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
          prompt: `主题：${theme}，情绪：${mood}，声线：${vocal}`,
        }),
      });

      const data = await response.json();
      if (data.success && data.style) {
        setSongStyle(data.style);
      }
    } catch (error) {
      console.error('生成风格失败:', error);
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
      // 获取用户选择的配置
      const theme = getThemeText();
      const mood = getMoodText();
      const vocal = getVocalText();

      // 使用用户输入的风格，如果为空则根据配置自动生成
      const finalStyle = songStyle.trim() || `${mood}, ${vocal}`;
      // 使用用户输入的标题，如果为空则自动生成
      const finalTitle = songTitle.trim() || `${theme}之歌`;
      // 使用用户选择的声音性别，如果为空则根据选择的声线推断
      const finalVocalGender = vocalGender || getVocalGender();

      // 调用 API 创建任务
      const result = await createMusicTask({
        prompt: lyrics,
        model: 'music-4.5', // 默认使用 4.5 模型
        customMode: true, // 使用自定义模式（歌词模式）
        style: finalStyle,
        title: finalTitle,
        instrumental: false,
        vocalGender: finalVocalGender,
        isPublic: false,
      });

      if (result.status === 'FAILURE') {
        throw new Error(result.error || '创建任务失败');
      }

      setCurrentTaskId(result.task_id);

      // 开始轮询
      pollingRef.current = setInterval(() => {
        pollTaskStatus(result.task_id);
      }, 5000); // 每 5 秒轮询一次

      // 首次立即查询
      await pollTaskStatus(result.task_id);
    } catch (error) {
      console.error('🎵 创建任务失败:', error);
      setIsGeneratingSong(false);
      alert(error instanceof Error ? error.message : '创建任务失败，请重试');
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

            {/* 自定义主题输入框 */}
            {selectedTheme === 'custom' && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  输入你的主题
                </label>
                <div className="relative">
                  <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="例如：毕业季、初恋、旅行、夏天的回忆..."
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

            {/* 自定义情绪输入框 */}
            {selectedMood === 'custom' && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  输入你想要的感觉
                </label>
                <div className="relative">
                  <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customMood}
                    onChange={(e) => setCustomMood(e.target.value)}
                    placeholder="例如：怀旧、清新、神秘、欢快..."
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
        // 获取显示用的选择
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
                {isGeneratingLyrics ? 'AI 正在为你创作歌词...' : '编辑你的歌词'}
              </h2>
              <p className="text-gray-600">
                {isGeneratingLyrics ? '请稍候，这可能需要几秒钟' : '不满意？可以点击重新生成'}
              </p>
            </div>

            {/* 用户选择摘要 */}
            <div className="bg-gradient-to-r from-pink-50 to-fuchsia-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">根据你的选择生成歌词：</p>
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

            <LyricsEditor
              lyrics={lyrics}
              onLyricsChange={setLyrics}
              onRegenerate={handleGenerateLyrics}
              isGenerating={isGeneratingLyrics}
            />
          </div>
        );

      case 4: // Generate
        // 获取显示用的主题
        const displayTheme = selectedTheme === 'custom'
          ? { id: 'custom', icon: '✏️', label: customTheme }
          : THEME_OPTIONS.find(opt => opt.id === selectedTheme);

        // 获取显示用的情绪
        const displayMood = selectedMood === 'custom'
          ? { id: 'custom', icon: '✏️', label: customMood }
          : MOOD_OPTIONS.find(opt => opt.id === selectedMood);

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
                  ? '请稍候，AI 正在根据你的选择创作音乐（约1-3分钟）'
                  : generatedAudioUrl
                  ? '试听一下？不满意可以再生成一次'
                  : '检查你的选择，确认后开始生成'}
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