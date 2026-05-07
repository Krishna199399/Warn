import client from './client';

export const categoriesApi = {
  getAll: () => client.get('/categories'),
  getOne: (id) => client.get(`/categories/${id}`),
  create: (data) => {
    // If data is FormData, let browser set Content-Type with boundary
    if (data instanceof FormData) {
      return client.post('/categories', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return client.post('/categories', data);
  },
  update: (id, data) => {
    // If data is FormData, let browser set Content-Type with boundary
    if (data instanceof FormData) {
      return client.put(`/categories/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return client.put(`/categories/${id}`, data);
  },
  delete: (id) => client.delete(`/categories/${id}`),
};
