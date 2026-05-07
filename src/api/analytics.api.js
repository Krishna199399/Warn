import client from './client';

export const analyticsApi = {
  getDashboard:    (config)  => client.get('/analytics/dashboard', config),
  getRevenueTrend: (timeRange = 'month', config) => client.get(`/analytics/revenue-trend?timeRange=${timeRange}`, config),
  getRegions:      (config)  => client.get('/analytics/regions', config),
  getTopAdvisors:  (config)  => client.get('/analytics/top-advisors', config),
};
