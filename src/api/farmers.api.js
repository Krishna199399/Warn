import client from './client';

export const farmersApi = {
  getMy:    (config)    => client.get('/farmers/my', config),
  getOne:   (id)       => client.get(`/farmers/${id}`),
  create:   (data)     => client.post('/farmers', data),
  update:   (id, data) => client.put(`/farmers/${id}`, data),
  getOrders:(id)       => client.get(`/farmers/${id}/orders`),
};
