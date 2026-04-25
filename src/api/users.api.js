import client from './client';

export const usersApi = {
  getAll:          (params)   => client.get('/users', { params }),
  getOne:          (id)       => client.get(`/users/${id}`),
  create:          (data)     => client.post('/users', data),
  update:          (id, data) => client.put(`/users/${id}`, data),
  remove:          (id)       => client.delete(`/users/${id}`),
  getDownline:     (id)       => client.get(`/users/${id}/downline`),
  getPerformance:  (id)       => client.get(`/users/${id}/performance?_t=${Date.now()}`), // Cache buster
  getHierarchy:    ()         => client.get('/users/hierarchy'),
  getPending:      ()         => client.get('/users/pending'),
  approve:         (id)       => client.put(`/users/${id}/approve`),
  reject:          (id, reason) => client.put(`/users/${id}/reject`, { reason }),
  assignParent:    (id, parentId) => client.put(`/users/${id}/assign-parent`, { parentId }),
  validateAdvisorCode: (code) => client.get(`/users/validate-advisor/${code}`),
};
