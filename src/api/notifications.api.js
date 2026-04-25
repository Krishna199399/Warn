import client from './client';

export const notificationsApi = {
  getAll: (config) => client.get('/notifications', config),
  markAllRead: (config) => client.put('/notifications/read-all', {}, config),
  markRead: (id, config) => client.put(`/notifications/${id}/read`, {}, config),
};
