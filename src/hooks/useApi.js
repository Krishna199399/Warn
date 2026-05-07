import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for API calls with automatic loading, error handling, and cleanup
 * @param {Function} apiCall - API function to call
 * @param {Object} options - Configuration options
 * @param {Array} options.dependencies - Dependencies array for refetch
 * @param {boolean} options.immediate - Whether to fetch immediately (default: true)
 * @param {Function} options.transform - Transform function for response data
 * @param {*} options.defaultValue - Default value when data is null (default: null)
 * @returns {Object} { data, loading, error, refetch }
 */
export function useApi(apiCall, options = {}) {
  const { dependencies = [], immediate = true, transform, defaultValue = null } = options;
  
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall({ signal });
      const rawData = response.data.data || response.data;
      const transformedData = transform ? transform(response) : rawData;
      setData(transformedData);
      return transformedData;
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        setError(err.response?.data?.error || err.message || 'An error occurred');
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, transform]);

  const refetch = useCallback(() => {
    const controller = new AbortController();
    return fetchData(controller.signal);
  }, [fetchData]);

  useEffect(() => {
    if (!immediate) return;
    
    const controller = new AbortController();
    fetchData(controller.signal);
    
    return () => controller.abort();
  }, dependencies);

  return { data, loading, error, refetch };
}
