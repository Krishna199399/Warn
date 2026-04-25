import client from './client';

export const productsApi = {
  getAll:  ()         => client.get('/products'),
  getOne:  (id)       => client.get(`/products/${id}`),
  create:  (data)     => client.post('/products', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  }),
  update:  (id, data) => client.put(`/products/${id}`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  }),
  remove:  (id)       => client.delete(`/products/${id}`),
};
