'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useStudio } from '@/contexts/StudioContext';
import { useCredits } from '@/contexts/CreditsContext';
import LoginModal from '@/components/features/auth/LoginModal';
import { GradientButton } from '@/components/ui';
import {
  voiceCategories,
  formatUsesCount,
  type CoverVoice,
} from '@/config/native/coverVoices';
import { getMusicRecords, type MusicRecord } from '@/actions/music';
import {
  getRvcVoiceModels,
  createCoverTask,
  getCoverTaskStatus,
  type RvcVoiceModel,
} from '@/actions/cover';
import {
  Music,
  Upload,
  Trash2,
  Heart,
  Play,
  Plus,
  Clock,
  Mic,
  ChevronUp,
  Check,
  X,
  Loader2,
  SlidersHorizontal,
  Eye,
  EyeOff,
} from 'lucide-react';

// localStorage key
const STORAGE_KEY = 'studio_cover_draft';

// Cover credits
const COVER_CREDITS = 50;

/**
 * Studio AI Cover Page
 *
 * AI翻唱页面，支持：
 * - 上传音频或从历史记录选择
 * - 选择声音模型
 * - 调整音调参数
 */
export default function StudioAiCoverPage() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { setTitle } = useStudio();
  const { refreshCredits } = useCredits();

  // UI States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isParameterSheetOpen, setIsParameterSheetOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation status
  const [generatingStatus, setGeneratingStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Cover specific states
  const [coverAudioSource, setCoverAudioSource] = useState<'upload' | 'history'>('upload');
  const [selectedVoice, setSelectedVoice] = useState<CoverVoice | null>(null);
  const [voiceCategory, setVoiceCategory] = useState('all');
  const [coverVoices, setCoverVoices] = useState<RvcVoiceModel[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [coverAudioFile, setCoverAudioFile] = useState<File | null>(null);
  const [coverAudioUrl, setCoverAudioUrl] = useState<string | null>(null);
  const [coverPitchChange, setCoverPitchChange] = useState(0);
  const [isPublic, setIsPublic] = useState(true);

  // History states
  const [musicHistory, setMusicHistory] = useState<MusicRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedHistoryMusic, setSelectedHistoryMusic] = useState<MusicRecord | null>(null);

  // Set page title
  useEffect(() => {
    setTitle('AI Cover');
  }, [setTitle]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.voiceCategory) setVoiceCategory(parsed.voiceCategory);
        if (typeof parsed.coverPitchChange === 'number') setCoverPitchChange(parsed.coverPitchChange);
        if (typeof parsed.isPublic === 'boolean') setIsPublic(parsed.isPublic);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      voiceCategory,
      coverPitchChange,
      isPublic,
    }));
  }, [voiceCategory, coverPitchChange, isPublic]);

  // Load voice models
  useEffect(() => {
    setIsLoadingVoices(true);
    getRvcVoiceModels(voiceCategory === 'all' ? undefined : voiceCategory)
      .then((voices) => {
        setCoverVoices(voices);
      })
      .catch((err) => {
        console.error('Failed to load cover voices:', err);
      })
      .finally(() => {
        setIsLoadingVoices(false);
      });
  }, [voiceCategory]);

  // Poll task status
  useEffect(() => {
    if (!currentTaskId || generatingStatus !== 'generating') return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await getCoverTaskStatus(currentTaskId);
        setGeneratingProgress(status.progress);

        if (status.status === 'SUCCESS') {
          setGeneratingStatus('success');
          setIsGenerating(false);
          setCurrentTaskId(null);
          void refreshCredits();
        } else if (status.status === 'FAILURE') {
          setGeneratingStatus('error');
          setGeneratingError(status.error || 'Cover generation failed');
          setIsGenerating(false);
          setCurrentTaskId(null);
        }
      } catch (err) {
        console.error('Poll status failed:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [currentTaskId, generatingStatus, refreshCredits]);

  // Handle audio file upload
  const handleCoverAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setError('Please select an audio file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setCoverAudioFile(file);
    const url = URL.createObjectURL(file);
    setCoverAudioUrl(url);
    setError(null);
  };

  // Clear audio
  const handleClearCoverAudio = useCallback(() => {
    if (coverAudioUrl) {
      URL.revokeObjectURL(coverAudioUrl);
    }
    setCoverAudioFile(null);
    setCoverAudioUrl(null);
    setSelectedHistoryMusic(null);
  }, [coverAudioUrl]);

  // Format duration (seconds -> MM:SS)
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    return new Date(date).toISOString().split('T')[0];
  };

  // Group music by date
  const groupMusicByDate = (records: MusicRecord[]): Record<string, MusicRecord[]> => {
    const groups: Record<string, MusicRecord[]> = {};
    records.forEach((record) => {
      const dateKey = formatDate(record.created_at);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(record);
    });
    return groups;
  };

  // Load music history
  const loadMusicHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const records = await getMusicRecords(50);
      const completedRecords = records.filter(
        (r) => r.status === 'SUCCESS' && r.audio_url
      );
      setMusicHistory(completedRecords);
    } catch (error) {
      console.error('Failed to load music history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Open history sheet
  const handleOpenHistorySheet = () => {
    setIsHistorySheetOpen(true);
    loadMusicHistory();
  };

  // Select history music
  const handleSelectHistoryMusic = (record: MusicRecord) => {
    setSelectedHistoryMusic(record);
    setCoverAudioFile(null);
    setCoverAudioUrl(record.audio_url);
    setIsHistorySheetOpen(false);
  };

  // Check if can generate
  const hasInput = (coverAudioFile !== null || selectedHistoryMusic !== null) && selectedVoice !== null;
  const estimatedCredits = hasInput ? COVER_CREDITS : 0;
  const canGenerate = hasInput && !isGenerating;

  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setGeneratingStatus('generating');
    setGeneratingError(null);
    setError(null);

    try {
      if ((!coverAudioFile && !selectedHistoryMusic) || !selectedVoice) {
        throw new Error('Please select an audio file and a voice');
      }

      let audioUrl: string;

      if (selectedHistoryMusic && selectedHistoryMusic.audio_url) {
        audioUrl = selectedHistoryMusic.audio_url;
      } else if (coverAudioFile) {
        // Upload audio file
        const formData = new FormData();
        formData.append('file', coverAudioFile);
        formData.append('type', 'cover-input');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload audio file');
        }

        const uploadResult = await uploadResponse.json();
        audioUrl = uploadResult.url;
      } else {
        throw new Error('No audio source available');
      }

      // Create cover task
      const result = await createCoverTask({
        originalAudioUrl: audioUrl,
        voiceModelId: selectedVoice.id,
        pitchChange: coverPitchChange,
        isPublic,
      });

      if (result.status === 'FAILURE') {
        setGeneratingStatus('error');
        setGeneratingError(result.error || 'Failed to create cover task');
        setIsGenerating(false);
        return;
      }

      // Task created successfully
      setCurrentTaskId(result.task_id);
      setGeneratingProgress(result.progress || 10);

      // Clear form
      handleClearCoverAudio();
      setSelectedVoice(null);
    } catch (err) {
      console.error('Cover error:', err);
      setGeneratingStatus('error');
      setGeneratingError(err instanceof Error ? err.message : 'Failed to create cover');
      setIsGenerating(false);
    }
  }, [canGenerate, user, coverAudioFile, selectedHistoryMusic, selectedVoice, coverPitchChange, isPublic, handleClearCoverAudio]);

  // Reset status
  const handleResetStatus = () => {
    setGeneratingStatus('idle');
    setGeneratingError(null);
    setGeneratingProgress(0);
  };

  // View history
  const handleViewHistory = () => {
    router.push('/studio/cover-history');
  };

  return (
    <>
      {/* Desktop Layout - Two Column */}
      <div className="hidden lg:flex flex-col bg-gradient-to-b from-white to-pink-50 lg:h-[calc(100vh-60px)] overflow-hidden">
        <div className="w-full max-w-[1600px] mx-auto px-6 py-4 flex-1 flex flex-col min-h-0">
          <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Left Column: Controls */}
            <div className="col-span-7 flex flex-col gap-4 min-h-0 overflow-y-auto">
              {/* Original Song Section */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                <div className="text-sm font-medium text-gray-700 mb-3">Original Song</div>

                {/* Tab: Upload Audio | Select from history */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                  <button
                    onClick={() => setCoverAudioSource('upload')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      coverAudioSource === 'upload'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Upload Audio
                  </button>
                  <button
                    onClick={() => {
                      setCoverAudioSource('history');
                      if (!selectedHistoryMusic) {
                        handleOpenHistorySheet();
                      }
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      coverAudioSource === 'history'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Select from history
                  </button>
                </div>

                {/* Upload Area or Selected Audio */}
                {coverAudioFile ? (
                  <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-xl border border-pink-200">
                    <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-medium truncate">{coverAudioFile.name}</p>
                      <p className="text-gray-500 text-xs">{(coverAudioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={handleClearCoverAudio}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : selectedHistoryMusic ? (
                  <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-xl border border-pink-200">
                    <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-medium truncate">
                        {selectedHistoryMusic.title || 'AI Music'}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {formatDuration(selectedHistoryMusic.duration)}
                      </p>
                    </div>
                    <button
                      onClick={handleClearCoverAudio}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-pink-500 transition-colors">
                      <Play className="w-5 h-5" />
                    </button>
                  </div>
                ) : coverAudioSource === 'history' ? (
                  <button
                    onClick={handleOpenHistorySheet}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-pink-400 hover:bg-pink-50/50 transition-colors"
                  >
                    <Upload className="w-6 h-6 text-gray-400" />
                    <p className="text-gray-500 text-sm">
                      Click to select an original song to create an AI cover.
                    </p>
                  </button>
                ) : (
                  <label className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-pink-400 hover:bg-pink-50/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleCoverAudioUpload}
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-gray-400" />
                    <p className="text-gray-500 text-sm">
                      Click to select an original song to create an AI cover.
                    </p>
                  </label>
                )}
              </div>

              {/* Parameters Section */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                <div className="text-sm font-medium text-gray-700 mb-3">Parameters</div>
                <button
                  onClick={() => setIsParameterSheetOpen(true)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 text-sm">
                      Pitch · {coverPitchChange > 0 ? '+' : ''}{coverPitchChange}
                    </span>
                  </div>
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                </button>

                {/* Visibility Toggle */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {isPublic ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm text-gray-600">Visibility</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsPublic(true)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isPublic ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      Public
                    </button>
                    <button
                      onClick={() => setIsPublic(false)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        !isPublic ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      Private
                    </button>
                  </div>
                </div>
              </div>

              {/* Select Voice Section */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                <div className="text-sm font-medium text-gray-700 mb-3">Select Voice</div>

                {/* Selected Voice Card */}
                {selectedVoice && (
                  <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl border border-pink-200 mb-4">
                    {selectedVoice.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedVoice.avatar_url}
                        alt={selectedVoice.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white font-bold text-lg">
                        {selectedVoice.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{selectedVoice.name}</p>
                      <p className="text-gray-500 text-sm">{formatUsesCount(selectedVoice.uses_count)} Uses</p>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-pink-500 transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                    {selectedVoice.sample_url && (
                      <button className="p-2 text-gray-400 hover:text-pink-500 transition-colors">
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide mb-4">
                  {voiceCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setVoiceCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        voiceCategory === cat.id
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Voice Grid */}
                <div className="grid grid-cols-6 gap-3">
                  {/* Clone Voice Button */}
                  <button className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-gray-500 mt-1.5 text-center">Clone Voice</span>
                  </button>

                  {/* Loading State */}
                  {isLoadingVoices && (
                    <div className="col-span-5 flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                    </div>
                  )}

                  {/* Voice Items */}
                  {!isLoadingVoices && coverVoices.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setSelectedVoice({
                        id: voice.id,
                        name: voice.name,
                        slug: voice.slug,
                        avatar_url: voice.avatar_url,
                        sample_url: voice.sample_url,
                        category: voice.category,
                        uses_count: voice.uses_count,
                        is_builtin: voice.is_builtin,
                      })}
                      className="flex flex-col items-center"
                    >
                      {voice.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={voice.avatar_url}
                          alt={voice.name}
                          className={`w-14 h-14 rounded-full object-cover transition-all ${
                            selectedVoice?.id === voice.id
                              ? 'ring-2 ring-pink-400 ring-offset-2'
                              : 'hover:ring-2 hover:ring-pink-300'
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${
                            selectedVoice?.id === voice.id
                              ? 'bg-gradient-to-br from-pink-500 to-rose-500 ring-2 ring-pink-400 ring-offset-2'
                              : 'bg-gradient-to-br from-gray-400 to-gray-500 hover:from-pink-400 hover:to-rose-400'
                          }`}
                        >
                          {voice.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs text-gray-700 mt-1.5 text-center truncate w-full">
                        {voice.name}
                      </span>
                    </button>
                  ))}

                  {/* Empty State */}
                  {!isLoadingVoices && coverVoices.length === 0 && (
                    <div className="col-span-5 text-center py-8">
                      <p className="text-gray-400 text-sm">No voices available in this category</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Button Card */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Credits Info */}
                {estimatedCredits > 0 && (
                  <div className="mb-4 p-3 bg-pink-50 rounded-xl text-sm text-pink-700">
                    This will use <span className="font-semibold">{estimatedCredits}</span> credits
                  </div>
                )}

                {/* Generate Button */}
                <GradientButton
                  onClick={() => void handleGenerate()}
                  disabled={!canGenerate}
                  fullWidth
                  size="lg"
                  variant="pink-rose"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mic className="w-5 h-5" />
                      <span>Create Cover</span>
                    </div>
                  )}
                </GradientButton>
              </div>
            </div>

            {/* Right Column: Preview */}
            <div className="col-span-5 flex flex-col min-h-0">
              <div className="flex-1 min-h-0 bg-gradient-to-br from-pink-50 to-rose-100 rounded-2xl border border-pink-200 flex overflow-hidden relative">
                {generatingStatus === 'generating' ? (
                  <div className="absolute inset-0 flex items-center justify-center px-8">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-200">
                        <Mic className="w-10 h-10 text-white animate-pulse" />
                      </div>
                      <h3 className="text-gray-900 font-semibold text-lg mb-2">Creating AI Cover...</h3>
                      {generatingProgress > 0 && (
                        <div className="mb-3">
                          <div className="w-48 h-2 bg-pink-200 rounded-full overflow-hidden mx-auto">
                            <div
                              className="h-full bg-gradient-to-r from-pink-400 to-rose-400 transition-all duration-300"
                              style={{ width: `${generatingProgress}%` }}
                            />
                          </div>
                          <p className="text-pink-600 text-sm font-medium mt-2">{generatingProgress}%</p>
                        </div>
                      )}
                      <p className="text-gray-500 text-sm">
                        Estimated time: <span className="text-pink-600 font-medium">2-3 minutes</span>
                      </p>
                    </div>
                  </div>
                ) : generatingStatus === 'success' ? (
                  <div className="absolute inset-0 flex items-center justify-center px-8">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-10 h-10 text-green-500" />
                      </div>
                      <h3 className="text-gray-900 font-semibold text-lg mb-2">AI Cover Created!</h3>
                      <p className="text-gray-500 text-sm mb-6">Your AI cover has been generated successfully.</p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={handleResetStatus}
                          className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 border border-gray-200"
                        >
                          Create Another
                        </button>
                        <button
                          onClick={handleViewHistory}
                          className="px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-md shadow-pink-200"
                        >
                          View History
                        </button>
                      </div>
                    </div>
                  </div>
                ) : generatingStatus === 'error' ? (
                  <div className="absolute inset-0 flex items-center justify-center px-8">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <X className="w-10 h-10 text-red-500" />
                      </div>
                      <h3 className="text-gray-900 font-semibold text-lg mb-2">Cover Failed</h3>
                      <p className="text-red-500 text-sm mb-6">{generatingError || 'Something went wrong.'}</p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={handleResetStatus}
                          className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 border border-gray-200"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            handleResetStatus();
                            void handleGenerate();
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-md shadow-pink-200"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
                    {/* Preview Idle State */}
                    <div className="w-24 h-24 rounded-full bg-white/60 border-2 border-dashed border-pink-300 flex items-center justify-center mb-4">
                      <Mic className="w-10 h-10 text-pink-300" />
                    </div>
                    <h3 className="text-gray-700 font-medium text-lg mb-2">AI Cover Preview</h3>
                    <p className="text-gray-500 text-sm text-center max-w-xs">
                      Select an original song and a voice model to create your AI cover.
                    </p>

                    {/* Show selected info */}
                    {(coverAudioFile || selectedHistoryMusic) && (
                      <div className="mt-4 p-3 bg-white/60 rounded-xl text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Song:</span>{' '}
                          {coverAudioFile?.name || selectedHistoryMusic?.title || 'AI Music'}
                        </p>
                      </div>
                    )}
                    {selectedVoice && (
                      <div className="mt-2 p-3 bg-white/60 rounded-xl text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Voice:</span> {selectedVoice.name}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col bg-gradient-to-b from-white to-pink-50 min-h-[calc(100vh-60px)]">
        <div className="flex-1 px-4 py-4 space-y-4 pb-24">
          {/* Original Song Section */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-700 mb-3">Original Song</div>

            {/* Tab */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              <button
                onClick={() => setCoverAudioSource('upload')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  coverAudioSource === 'upload'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Upload Audio
              </button>
              <button
                onClick={() => {
                  setCoverAudioSource('history');
                  if (!selectedHistoryMusic) {
                    handleOpenHistorySheet();
                  }
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  coverAudioSource === 'history'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                From history
              </button>
            </div>

            {/* Upload Area or Selected Audio */}
            {coverAudioFile ? (
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl border border-pink-200">
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500">
                  <Music className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-medium truncate">{coverAudioFile.name}</p>
                  <p className="text-gray-500 text-xs">{(coverAudioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={handleClearCoverAudio}
                  className="p-1.5 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : selectedHistoryMusic ? (
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl border border-pink-200">
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500">
                  <Music className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-medium truncate">
                    {selectedHistoryMusic.title || 'AI Music'}
                  </p>
                  <p className="text-gray-500 text-xs">{formatDuration(selectedHistoryMusic.duration)}</p>
                </div>
                <button
                  onClick={handleClearCoverAudio}
                  className="p-1.5 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : coverAudioSource === 'history' ? (
              <button
                onClick={handleOpenHistorySheet}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center gap-3 hover:border-pink-400"
              >
                <Upload className="w-5 h-5 text-gray-400" />
                <p className="text-gray-500 text-sm">Click to select a song</p>
              </button>
            ) : (
              <label className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center gap-3 hover:border-pink-400 cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleCoverAudioUpload}
                  className="hidden"
                />
                <Upload className="w-5 h-5 text-gray-400" />
                <p className="text-gray-500 text-sm">Click to upload audio</p>
              </label>
            )}
          </div>

          {/* Voice Selection */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-700 mb-3">Select Voice</div>

            {/* Selected Voice */}
            {selectedVoice && (
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl border border-pink-200 mb-4">
                {selectedVoice.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedVoice.avatar_url}
                    alt={selectedVoice.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white font-bold">
                    {selectedVoice.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-gray-900 font-medium text-sm">{selectedVoice.name}</p>
                  <p className="text-gray-500 text-xs">{formatUsesCount(selectedVoice.uses_count)} Uses</p>
                </div>
              </div>
            )}

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
              {voiceCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setVoiceCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    voiceCategory === cat.id
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Voice Grid */}
            <div className="grid grid-cols-5 gap-2">
              {/* Clone Voice */}
              <button className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-gray-500 mt-1">Clone</span>
              </button>

              {/* Loading */}
              {isLoadingVoices && (
                <div className="col-span-4 flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
                </div>
              )}

              {/* Voices */}
              {!isLoadingVoices && coverVoices.slice(0, 9).map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice({
                    id: voice.id,
                    name: voice.name,
                    slug: voice.slug,
                    avatar_url: voice.avatar_url,
                    sample_url: voice.sample_url,
                    category: voice.category,
                    uses_count: voice.uses_count,
                    is_builtin: voice.is_builtin,
                  })}
                  className="flex flex-col items-center"
                >
                  {voice.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={voice.avatar_url}
                      alt={voice.name}
                      className={`w-12 h-12 rounded-full object-cover ${
                        selectedVoice?.id === voice.id ? 'ring-2 ring-pink-400' : ''
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        selectedVoice?.id === voice.id
                          ? 'bg-gradient-to-br from-pink-500 to-rose-500 ring-2 ring-pink-400'
                          : 'bg-gradient-to-br from-gray-400 to-gray-500'
                      }`}
                    >
                      {voice.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-[10px] text-gray-700 mt-1 truncate w-full text-center">
                    {voice.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <button
              onClick={() => setIsParameterSheetOpen(true)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  Pitch · {coverPitchChange > 0 ? '+' : ''}{coverPitchChange}
                </span>
              </div>
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-area-bottom">
          <GradientButton
            onClick={() => void handleGenerate()}
            disabled={!canGenerate}
            fullWidth
            size="lg"
            variant="pink-rose"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                <span>Create Cover</span>
              </div>
            )}
          </GradientButton>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Parameter Sheet */}
      {isParameterSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsParameterSheetOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl lg:rounded-2xl w-full lg:max-w-md p-6">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6 lg:hidden" />

            <h3 className="text-lg font-semibold text-gray-900 mb-6">Parameters</h3>

            {/* Pitch Adjustment */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700 font-medium">Pitch Adjustment</span>
                <span className="text-gray-500 text-sm">{coverPitchChange > 0 ? '+' : ''}{coverPitchChange} semitones</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                value={coverPitchChange}
                onChange={(e) => setCoverPitchChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>-12</span>
                <span>0</span>
                <span>+12</span>
              </div>
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">Public</span>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isPublic ? 'bg-pink-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    isPublic ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Done Button */}
            <button
              onClick={() => setIsParameterSheetOpen(false)}
              className="w-full mt-6 py-3 bg-pink-500 text-white font-medium rounded-xl hover:bg-pink-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* History Sheet */}
      {isHistorySheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsHistorySheetOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl lg:rounded-2xl w-full lg:max-w-lg max-h-[70vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0 lg:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Select from History</h3>
              <button
                onClick={() => setIsHistorySheetOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                </div>
              ) : musicHistory.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No music history yet</p>
                </div>
              ) : (
                Object.entries(groupMusicByDate(musicHistory)).map(([date, records]) => (
                  <div key={date}>
                    {/* Date Header */}
                    <div className="flex items-center gap-2 text-gray-500 text-sm py-3">
                      <Clock className="w-4 h-4" />
                      <span>{date}</span>
                    </div>

                    {/* Records */}
                    <div className="space-y-1">
                      {records.map((record) => (
                        <button
                          key={record.id}
                          onClick={() => handleSelectHistoryMusic(record)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-pink-50 rounded-xl transition-colors"
                        >
                          {/* Cover Image */}
                          {record.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={record.cover_url}
                              alt={record.title || 'AI Music'}
                              className="w-14 h-14 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
                              <Music className="w-5 h-5 text-white" />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-gray-900 font-medium truncate">
                              {record.title || 'AI Music'}
                            </p>
                            {record.style && (
                              <p className="text-gray-500 text-sm truncate">{record.style}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-2" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Generation Status Modal */}
      {generatingStatus !== 'idle' && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-[90%] max-w-sm aspect-[3/4] bg-gradient-to-br from-pink-50 to-rose-100 rounded-2xl border border-pink-200 flex items-center justify-center overflow-hidden">
            {generatingStatus === 'generating' ? (
              <div className="text-center px-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-200">
                  <Mic className="w-10 h-10 text-white animate-pulse" />
                </div>
                <h3 className="text-gray-900 font-semibold text-lg mb-2">Creating AI Cover...</h3>
                {generatingProgress > 0 && (
                  <div className="mb-3">
                    <div className="w-48 h-2 bg-pink-200 rounded-full overflow-hidden mx-auto">
                      <div
                        className="h-full bg-gradient-to-r from-pink-400 to-rose-400 transition-all duration-300"
                        style={{ width: `${generatingProgress}%` }}
                      />
                    </div>
                    <p className="text-pink-600 text-sm font-medium mt-2">{generatingProgress}%</p>
                  </div>
                )}
                <p className="text-gray-500 text-sm">
                  Estimated time: <span className="text-pink-600 font-medium">2-3 minutes</span>
                </p>
              </div>
            ) : generatingStatus === 'success' ? (
              <div className="text-center px-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-gray-900 font-semibold text-lg mb-2">AI Cover Created!</h3>
                <p className="text-gray-500 text-sm mb-6">Your AI cover has been generated successfully.</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleViewHistory}
                    className="px-6 py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-md shadow-pink-200"
                  >
                    View History
                  </button>
                  <button
                    onClick={handleResetStatus}
                    className="px-6 py-3 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 border border-gray-200"
                  >
                    Create Another
                  </button>
                </div>
              </div>
            ) : generatingStatus === 'error' ? (
              <div className="text-center px-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-gray-900 font-semibold text-lg mb-2">Cover Failed</h3>
                <p className="text-red-500 text-sm mb-6">{generatingError || 'Something went wrong.'}</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      handleResetStatus();
                      void handleGenerate();
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-md shadow-pink-200"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleResetStatus}
                    className="px-6 py-3 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 border border-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
