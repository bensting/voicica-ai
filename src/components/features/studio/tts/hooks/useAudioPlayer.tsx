import { useState, useCallback } from 'react';
import type { Voice } from '@/types/voice';
import { getVoiceSampleUrl } from '@/types/voice';

/**
 * 音频播放 Hook
 */
export function useAudioPlayer() {
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const handlePlayPause = useCallback((voice: Voice, e: React.MouseEvent, style?: string | null) => {
    e.stopPropagation();

    // 如果点击的是正在播放的音频，则暂停
    if (playingVoiceId === voice.id && currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setPlayingVoiceId(null);
      return;
    }

    // 停止当前正在播放的音频
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // 创建并播放新音频（支持指定 style）
    const sampleUrl = getVoiceSampleUrl(voice, style);
    const audio = new Audio(sampleUrl);

    // 监听音频结束事件
    audio.addEventListener('ended', () => {
      setCurrentAudio(null);
      setPlayingVoiceId(null);
    });

    // 监听播放错误
    audio.addEventListener('error', (err) => {
      console.error('播放失败:', err);
      setCurrentAudio(null);
      setPlayingVoiceId(null);
    });

    audio.play().catch(err => {
      console.error('播放失败:', err);
      setCurrentAudio(null);
      setPlayingVoiceId(null);
    });

    setCurrentAudio(audio);
    setPlayingVoiceId(voice.id);
  }, [currentAudio, playingVoiceId]);

  return {
    playingVoiceId,
    handlePlayPause,
  };
}
