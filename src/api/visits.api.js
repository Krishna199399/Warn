import client from './client';

export const visitsApi = {
  // Create visit
  create: (data) => client.post('/visits', data),

  // Get visits
  getMy: (params) => client.get('/visits/my', { params }),
  getToday: () => client.get('/visits/today'),
  getUpcoming: () => client.get('/visits/upcoming'),
  getOverdue: () => client.get('/visits/overdue'),
  getById: (id) => client.get(`/visits/${id}`),
  getFarmerVisits: (farmerId) => client.get(`/visits/farmer/${farmerId}`),

  // Update visit
  complete: (id, data) => client.put(`/visits/${id}/complete`, data),
  reschedule: (id, data) => client.put(`/visits/${id}/reschedule`, data),
  cancel: (id) => client.delete(`/visits/${id}`),

  // Admin
  getAdminStats: () => client.get('/visits/admin/stats'),
  getAdvisorPerformance: () => client.get('/visits/admin/advisors'),
  getAllVisitsAdmin: (params) => client.get('/visits/admin/all', { params })
};
