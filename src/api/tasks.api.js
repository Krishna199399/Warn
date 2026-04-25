import client from './client';

export const tasksApi = {
  getMy:    ()         => client.get('/tasks/my'),
  create:   (data)     => client.post('/tasks', data),
  update:   (id, data) => client.put(`/tasks/${id}`, data),
  remove:   (id)       => client.delete(`/tasks/${id}`),
};
