import client from './client';

export const promotionsApi = {
  request:        ()               => client.post('/promotions/request'),
  getMy:          ()               => client.get('/promotions/my'),
  getPending:     ()               => client.get('/promotions/pending'),
  getPendingAdmin:()               => client.get('/promotions/pending/admin'),
  getAll:         ()               => client.get('/promotions/all'),
  approveParent:  (id, note)       => client.post(`/promotions/${id}/approve-parent`, { note }),
  rejectParent:   (id, reason)     => client.post(`/promotions/${id}/reject-parent`, { reason }),
  approveAdmin:   (id, note)       => client.post(`/promotions/${id}/approve-admin`, { note }),
  rejectAdmin:    (id, reason)     => client.post(`/promotions/${id}/reject-admin`, { reason }),
};
