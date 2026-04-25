import client from './client';

export const commissionsApi = {
  getMy:        (config)   => client.get(`/commissions/my?_t=${Date.now()}`, config),
  getSummary:   (config)   => client.get(`/commissions/summary?_t=${Date.now()}`, config),
  getSubtree:   ()         => client.get('/commissions/subtree'),
  getByOrder:   (orderId)  => client.get(`/commissions/order/${orderId}`),
};
