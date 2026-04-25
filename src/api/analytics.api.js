import client from './client';

export const analyticsApi = {
  getDashboard:    (config)  => client.get('/analytics/dashboard', config),
  getRevenueTrend: (config)  => client.get('/analytics/revenue-trend', config),
  getRegions:      (config)  => client.get('/analytics/regions', config),
  getTopAdvisors:  (config)  => client.get('/analytics/top-advisors', config),
};
