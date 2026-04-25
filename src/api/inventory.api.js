import client from './client';

export const inventoryApi = {
  getMy:              ()     => client.get('/inventory/my'),
  addStock:           (data) => client.post('/inventory/add-stock', data),
  transfer:           (data) => client.post('/inventory/transfer', data),
  getTransfers:       ()     => client.get('/inventory/transfers'),
  getMiniStockUsers:  ()     => client.get('/inventory/ministock-users'),
};
