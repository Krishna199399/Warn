import client from './client';

export const payoutsApi = {
  // Employee
  getMyPayouts:      ()          => client.get('/payouts/my-payouts'),
  getMyBankDetails:  ()          => client.get('/payouts/bank-details'),
  saveBankDetails:   (data)      => client.post('/payouts/bank-details', data),

  // Admin
  getSummary:        ()          => client.get('/payouts/summary'),
  getBatches:        (params)    => client.get('/payouts/batches', { params }),
  getBatchDetail:    (id)        => client.get(`/payouts/batches/${id}`),
  generateBatch:     (data)      => client.post('/payouts/batches/generate', data),
  payOne:            (bId, data) => client.post(`/payouts/batches/${bId}/pay-one`, data),
  payAll:            (bId)       => client.post(`/payouts/batches/${bId}/pay-all`),
  exportBatch:       (bId)       => client.get(`/payouts/batches/${bId}/export`, { responseType: 'blob' }),
  verifyBank:        (userId)    => client.put(`/payouts/admin/bank/${userId}/verify`),
};
