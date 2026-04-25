import client from './client';

export const hierarchyApi = {
  getTree:      ()         => client.get('/users/hierarchy'),
  getNode:      (userId)   => client.get(`/users/${userId}`),
  getDownline:  (userId)   => client.get(`/users/${userId}/downline`),
  getPerformance:(userId)  => client.get(`/users/${userId}/performance`),
};
