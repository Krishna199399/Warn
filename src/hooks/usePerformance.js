import { useState, useEffect } from 'react';
import { usersApi } from '../api/users.api';

/**
 * Custom hook for fetching performance data
 * @param {string} userId - User ID to fetch performance for
 * @returns {Object} { performance, advisors, loading, error }
 */
export function usePerformance(userId) {
  const [performance, setPerformance] = useState(null);
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    
    Promise.all([
      usersApi.getPerformance(userId, { signal: controller.signal }),
      usersApi.getAll({ role: 'ADVISOR', signal: controller.signal }),
    ])
      .then(([perfRes, advisorsRes]) => {
        setPerformance(perfRes.data.data);
        setAdvisors(advisorsRes.data.data || []);
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          setError(err.response?.data?.error || err.message || 'Failed to load performance data');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [userId]);

  return { performance, advisors, loading, error };
}
