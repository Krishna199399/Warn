import client from './client';

export const benefitClaimsApi = {
  // Employee: Create a claim for an earned benefit
  create: (data) => client.post('/benefit-claims/create', data),

  // Employee: Get my claims
  getMyClaims: () => client.get('/benefit-claims/my-claims'),

  // Admin: Get all claims with optional filters
  getAll: (params) => client.get('/benefit-claims/admin/all', { params }),

  // Admin: Approve a claim
  approve: (id, data) => client.put(`/benefit-claims/admin/${id}/approve`, data),

  // Admin: Mark claim as paid
  markPaid: (id, data) => client.put(`/benefit-claims/admin/${id}/mark-paid`, data),

  // Admin: Reject a claim
  reject: (id, data) => client.put(`/benefit-claims/admin/${id}/reject`, data),
};
