import client from './client';

// Get active pool configuration
export const getPoolConfig = async () => {
  const response = await client.get('/config/pool');
  return response.data;
};

// Get all income configurations
export const getIncomeConfigs = async () => {
  const response = await client.get('/config/income');
  return response.data;
};

// Get complete configuration (pool + income)
export const getCompleteConfig = async () => {
  const response = await client.get('/config/complete');
  return response.data;
};

// Update pool configuration (Admin only)
export const updatePoolConfig = async (data) => {
  const response = await client.put('/config/pool', data);
  return response.data;
};

// Update income configuration for a role (Admin only)
export const updateIncomeConfig = async (role, data) => {
  const response = await client.put(`/config/income/${role}`, data);
  return response.data;
};

// Get configuration history (Admin only)
export const getConfigHistory = async () => {
  const response = await client.get('/config/history');
  return response.data;
};
