import client from './client';

export const commissionsApi = {
  getMy:        (config)   => client.get(`/commissions/my?_t=${Date.now()}`, config),
  getSummary:   (config)   => client.get(`/commissions/summary?_t=${Date.now()}`, config),
  getSubtree:   ()         => client.get('/commissions/subtree'),
  getByOrder:   (orderId)  => client.get(`/commissions/order/${orderId}`),
  getAll:       (params)   => client.get('/commissions', { params }), // Added for admin/employee detail pages
};

export const salaryApi = {
  getMyStatus:          ()       => client.get(`/salary/my-status?_t=${Date.now()}`),
  getMyRewards:         ()       => client.get(`/salary/my-rewards?_t=${Date.now()}`),
  getAdminPlans:        ()       => client.get('/salary/admin/plans'),
  getAdminUsers:        ()       => client.get('/salary/admin/users'),
  getAdminAchievements: ()       => client.get('/salary/admin/achievements'),
  updatePlan:           (id, d)  => client.put(`/salary/admin/plans/${id}`, d),
};

