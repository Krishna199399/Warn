import client from './client';

export const usersApi = {
  getAll:          (params)   => client.get('/users', { params }),
  getOne:          (id)       => client.get(`/users/${id}`),
  create:          (data)     => client.post('/users', data),
  update:          (id, data) => client.put(`/users/${id}`, data),
  remove:          (id)       => client.delete(`/users/${id}`),
  getDownline:     (id, directOnly = false) => client.get(`/users/${id}/downline`, { params: { directOnly } }),
  getPerformance:  (id)       => client.get(`/users/${id}/performance?_t=${Date.now()}`),
  getHierarchy:    ()         => client.get('/users/hierarchy'),
  getPending:      ()         => client.get('/users/pending'),
  getWholesaleSellers: ()     => client.get('/users/wholesale-sellers'),
  approve:         (id)       => client.put(`/users/${id}/approve`),
  reject:          (id, reason) => client.put(`/users/${id}/reject`, { reason }),
  assignParent:    (id, parentId) => client.put(`/users/${id}/assign-parent`, { parentId }),
  validateAdvisorCode: (code) => client.get(`/users/validate-advisor/${code}`),
  terminate:       (id, reason) => client.put(`/users/${id}/terminate`, { reason }),
  getActivity:     (id)       => client.get(`/users/${id}/activity`),
  updateKYC:       (data)     => client.post('/users/kyc', data),
  getKYC:          (userId)   => userId 
    ? client.get(`/users/${userId}/kyc`) 
    : client.get('/users/kyc'),
  approveKYC:      (userId)   => client.put(`/users/${userId}/kyc/approve`),
  rejectKYC:       (userId, reason) => client.put(`/users/${userId}/kyc/reject`, { reason }),
  
  // Employee Registration Management
  getPendingEmployeeRegistrations: () => client.get('/users/employee-registrations/pending'),
  getEmployeeRegistrationStats: () => client.get('/users/employee-registrations/stats'),
  approveEmployeeRegistration: (id, parentId = null) => client.post(`/users/${id}/employee-registrations/approve`, { parentId }),
  rejectEmployeeRegistration: (id, reason) => client.post(`/users/${id}/employee-registrations/reject`, { reason }),
  bulkImportEmployees: (employees) => client.post('/users/employee-registrations/bulk-import', { employees }),
};

