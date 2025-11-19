import { useState, useEffect, useCallback } from 'react';
import { listVoices } from '@/actions/voice';
import type { Voice } from '@/types/voice';
import type { LocaleOption } from '@/types/config';
import type { User } from 'firebase/auth';

interface UseVoicesProps {
  locale: string;
  user: User | null;
  authLoading: boolean;
}

interface UseVoicesReturn {
  // Data state
  voices: Voice[];
  filteredVoices: Voice[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;

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
  loadMoreVoices: () => Promise<void>;
}

/**
 * Custom hook for Voices Gallery business logic
 *
 * Handles:
 * - Voice data fetching
 * - Search and filtering
 * - Audio playback
 */
export function useVoices({ authLoading }: UseVoicesProps): UseVoicesReturn {
  // Voices data state
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;

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

  // Load voices (initial load or refresh)
  const loadVoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build API params
      const params: {
        is_active: boolean;
        page: number;
        page_size: number;
        locale?: string;
        gender?: string;
        tag?: string;
      } = {
        is_active: true,
        page: 1,
        page_size: pageSize,
      };

      if (selectedLanguage) {
        params.locale = selectedLanguage.code;
      }

      if (selectedGender !== 'all') {
        params.gender = selectedGender;
      }

      if (selectedTagId !== 'all' && selectedTagId !== 'my-clone' && selectedTagId !== 'used') {
        params.tag = selectedTagId;
      }

      const response = await listVoices(params);

      setVoices(response.voices as Voice[]);
      setTotal(response.total);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (err) {
      console.error('Failed to load voices:', err);
      setError('Failed to load voices');
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage, selectedGender, selectedTagId, pageSize]);

  // Load more voices (pagination)
  const loadMoreVoices = useCallback(async () => {
    if (loadingMore || currentPage >= totalPages) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;

      // Build API params
      const params: {
        is_active: boolean;
        page: number;
        page_size: number;
        locale?: string;
        gender?: string;
        tag?: string;
      } = {
        is_active: true,
        page: nextPage,
        page_size: pageSize,
      };

      if (selectedLanguage) {
        params.locale = selectedLanguage.code;
      }

      if (selectedGender !== 'all') {
        params.gender = selectedGender;
      }

      if (selectedTagId !== 'all' && selectedTagId !== 'my-clone' && selectedTagId !== 'used') {
        params.tag = selectedTagId;
      }

      const response = await listVoices(params);

      setVoices((prev) => [...prev, ...(response.voices as Voice[])]);
      setTotal(response.total);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (err) {
      console.error('Failed to load more voices:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, currentPage, totalPages, selectedLanguage, selectedGender, selectedTagId, pageSize]);

  // Initial load and reload when filters change
  // Wait for authentication to complete before loading voices
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) {
      return;
    }

    // Load voices for both authenticated and anonymous users
    // API client will handle authentication automatically:
    // - Authenticated users: use Firebase token
    // - Anonymous users: use device fingerprint
    void loadVoices();
  }, [loadVoices, authLoading]);

  // Filter voices based on search query (client-side only)
  // Other filters (language, gender, tag) are handled by API
  const filteredVoices = voices.filter((voice) => {
    // Search filter (client-side for better UX)
    if (searchQuery) {
      const voiceName = voice.display_name.toLowerCase();
      if (!voiceName.includes(searchQuery.toLowerCase())) {
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

  // Calculate hasMore
  const hasMore = currentPage < totalPages;

  return {
    // Data state
    voices,
    filteredVoices,
    loading,
    loadingMore,
    error,
    hasMore,
    total,

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
    loadMoreVoices,
  };
}