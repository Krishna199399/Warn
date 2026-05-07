import client from './client';

export const authApi = {
  register:        (data)                 => client.post('/auth/register', data),
  registerEmployee: (data)                => client.post('/auth/register-employee', data),
  login:           (identifier, password) => client.post('/auth/login', { identifier, password }),
  logout:          ()                     => client.post('/auth/logout'),
  refresh:         ()                     => client.post('/auth/refresh'),
  me:              ()                     => client.get('/auth/me'),
  updateProfile:   (data)                 => client.put('/auth/profile', data),
  changePassword:  (data)                 => client.put('/auth/change-password', data),
  deleteMyAccount: (password)             => client.delete('/auth/delete-account', { data: { password } }),
};

// Export individual functions for convenience
export const registerEmployee = (data) => authApi.registerEmployee(data);

