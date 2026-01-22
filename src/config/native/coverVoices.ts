/**
 * Cover Voice Configuration
 * Voice categories and types for Cover tab
 * Actual voice data is fetched from database via server actions
 */

export interface CoverVoice {
  id: number;
  name: string;
  slug: string;
  avatar_url: string | null;
  sample_url: string | null;
  category: string;
  uses_count: number;
  is_builtin: boolean;
}

export interface VoiceCategory {
  id: string;
  label: string;
}

export const voiceCategories: VoiceCategory[] = [
  { id: 'all', label: 'All' },
  { id: 'my-clone', label: 'My clone' },
  { id: 'music', label: 'Music' },
  { id: 'rapper', label: 'Rapper' },
  { id: 'celebrity', label: 'Celebrity' },
  { id: 'cartoon', label: 'Cartoon' },
  { id: 'anime', label: 'Anime' },
];

/**
 * Format uses count for display (e.g., 2800000 -> "2.8m")
 */
export function formatUsesCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}m`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

/**
 * Get avatar initial for voice (first letter of name)
 */
export function getVoiceInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}
