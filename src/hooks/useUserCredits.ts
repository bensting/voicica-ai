import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';

/**
 * 用户积分响应接口
 */
interface CreditsResponse {
  credits: number;
  total_used: number;
  is_anonymous: boolean;
  expires_at: string | null;
}

/**
 * Hook to get user credits from backend API
 *
 * Supports both authenticated and anonymous users:
 * - Authenticated users: Uses Authorization token
 * - Anonymous users: Uses device fingerprint (automatically handled by apiClient)
 */
export function useUserCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call backend API - apiClient automatically handles auth headers
        const response = await apiClient.get<CreditsResponse>(
          '/api/v1/users/credits'
        );

        setCredits(response.credits);

        console.log('✅ 积分获取成功:', {
          credits: response.credits,
          total_used: response.total_used,
          is_anonymous: response.is_anonymous,
          expires_at: response.expires_at,
        });
      } catch (err) {
        console.error('❌ 获取积分失败:', err);
        setError('Failed to fetch credits');
        setCredits(0);
      } finally {
        setLoading(false);
      }
    };

    void fetchCredits();
  }, [user]);

  return { credits, loading, error };
}