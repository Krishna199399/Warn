import client from './client';

export const authApi = {
  register: (data)                   => client.post('/auth/register', data),
  login:    (identifier, password)   => client.post('/auth/login', { identifier, password }),
  logout:   ()                       => client.post('/auth/logout'),
  refresh:  ()                       => client.post('/auth/refresh'),
  me:       ()                       => client.get('/auth/me'),
};
