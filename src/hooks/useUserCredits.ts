import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to get user credits
 *
 * TODO: Connect to real API endpoint
 * For now returns mock data
 */
export function useUserCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setLoading(true);

        // TODO: Replace with real API call
        // const response = await apiClient.get('/api/v1/user/credits');
        // setCredits(response.credits);

        // Mock data for now
        if (user) {
          // Logged in user: 2000 credits
          setCredits(2000);
        } else {
          // Anonymous user: 1000 credits
          setCredits(1000);
        }
      } catch (error) {
        console.error('Failed to fetch user credits:', error);
        setCredits(0);
      } finally {
        setLoading(false);
      }
    };

    void fetchCredits();
  }, [user]);

  return { credits, loading };
}