import { useState, useEffect, useCallback } from 'react';
import { getVoices } from '@/lib/api/voice';
import { getLocalizedVoiceName } from '@/types/voice';
import type { Voice } from '@/types/voice';
import type { LocaleOption } from '@/types/config';

interface UseVoicesProps {
  locale: string;
}

interface UseVoicesReturn {
  // Data state
  voices: Voice[];
  filteredVoices: Voice[];
  loading: boolean;
  error: string | null;

  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Language filter state
  selectedLanguage: LocaleOption | null;
  setSelectedLanguage: (language: LocaleOption | null) => void;

  // Tag filter state
  selectedTagId: string;
  setSelectedTagId: (tagId: string) => void;

  // Gender filter state
  selectedGender: string;
  setSelectedGender: (gender: string) => void;

  // Audio playback state
  playingVoiceId: string | null;
  handlePlayVoice: (voice: Voice) => void;

  // Actions
  refreshVoices: () => Promise<void>;
}

/**
 * Custom hook for Voices Gallery business logic
 *
 * Handles:
 * - Voice data fetching
 * - Search and filtering
 * - Audio playback
 */
export function useVoices({ locale }: UseVoicesProps): UseVoicesReturn {
  // Voices data state
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Language filter state
  const [selectedLanguage, setSelectedLanguage] = useState<LocaleOption | null>(null);

  // Tag filter state
  const [selectedTagId, setSelectedTagId] = useState('all');

  // Gender filter state
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // Audio player state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Load voices
  const loadVoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVoices({ is_active: true });
      setVoices(data);
    } catch (err) {
      console.error('Failed to load voices:', err);
      setError('Failed to load voices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVoices();
  }, [loadVoices]);

  // Filter voices based on all criteria
  const filteredVoices = voices.filter((voice) => {
    // Search filter
    if (searchQuery) {
      const voiceName = getLocalizedVoiceName(voice, locale).toLowerCase();
      if (!voiceName.includes(searchQuery.toLowerCase())) {
        return false;
      }
    }

    // Language filter
    if (selectedLanguage && voice.locale !== selectedLanguage.code) {
      return false;
    }

    // Gender filter
    if (selectedGender !== 'all' && voice.gender !== selectedGender) {
      return false;
    }

    // Tag filter
    if (selectedTagId !== 'all') {
      if (selectedTagId === 'my-clone') {
        // TODO: Implement my clone logic
        return false;
      }
      if (selectedTagId === 'used') {
        // TODO: Implement used voices logic
        return false;
      }
      // Check if voice has this tag
      if (!voice.tags.includes(selectedTagId)) {
        return false;
      }
    }

    return true;
  });

  // Handle audio playback
  const handlePlayVoice = useCallback((voice: Voice) => {
    if (playingVoiceId === voice.id) {
      // Pause current
      audioElement?.pause();
      setPlayingVoiceId(null);
    } else {
      // Stop previous and play new
      audioElement?.pause();
      const audio = new Audio(voice.voice_sample_url);
      audio.play();
      audio.onended = () => setPlayingVoiceId(null);
      setAudioElement(audio);
      setPlayingVoiceId(voice.id);
    }
  }, [audioElement, playingVoiceId]);

  return {
    // Data state
    voices,
    filteredVoices,
    loading,
    error,

    // Search state
    searchQuery,
    setSearchQuery,

    // Language filter state
    selectedLanguage,
    setSelectedLanguage,

    // Tag filter state
    selectedTagId,
    setSelectedTagId,

    // Gender filter state
    selectedGender,
    setSelectedGender,

    // Audio playback state
    playingVoiceId,
    handlePlayVoice,

    // Actions
    refreshVoices: loadVoices,
  };
}