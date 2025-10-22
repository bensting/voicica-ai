import { useCredits } from '@/contexts/CreditsContext';

/**
 * Hook to get user credits from backend API
 *
 * @deprecated Use `useCredits()` from CreditsContext directly for better functionality
 * This hook is kept for backward compatibility
 *
 * Supports both authenticated and anonymous users:
 * - Authenticated users: Uses Authorization token
 * - Anonymous users: Uses device fingerprint (automatically handled by apiClient)
 */
export function useUserCredits() {
  const { credits, loading, error } = useCredits();
  return { credits, loading, error };
}