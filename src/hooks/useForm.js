import { useState, useCallback } from 'react';

/**
 * Custom hook for form state management with loading and error handling
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Submit handler function
 * @returns {Object} Form state and handlers
 */
export function useForm(initialValues, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setError('');
  }, [initialValues]);

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setError('');
    
    try {
      await onSubmit(values);
      reset();
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [values, onSubmit, reset]);

  return {
    values,
    loading,
    error,
    handleChange,
    handleSubmit,
    reset,
    setError,
  };
}
