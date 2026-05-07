import client from './client';

export const ordersApi = {
  // Role-specific list endpoints
  getAdminOrders:     () => client.get('/orders/admin'),
  getWholesaleOrders: () => client.get('/orders/wholesale'),
  getMyPurchases:     () => client.get('/orders/my-purchases'),
  getMiniOrders:      () => client.get('/orders/mini'),

  // General
  getAll:          (config)      => client.get('/orders', config),
  getMy:           (config)      => client.get('/orders/my', config),
  getOne:          (id)          => client.get(`/orders/${id}`),
  create:          (data)       => client.post('/orders', data),
  createCustomerOrder: (data)   => client.post('/orders/customer', data),
  updateStatus:    (id, status) => client.put(`/orders/${id}/status`, { status }),
  verifyPayment:   (id)         => client.put(`/orders/${id}/verify-payment`),
  approve:         (id)         => client.put(`/orders/${id}/approve`),
  reject:          (id)         => client.put(`/orders/${id}/reject`),
  ship:            (id)         => client.put(`/orders/${id}/ship`),
  confirmDelivery: (id)         => client.put(`/orders/${id}/deliver`),
  createPOSSale:   (data)       => client.post('/orders/pos-sale', data),
};
