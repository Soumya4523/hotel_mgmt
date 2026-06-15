import client from './client.js'

export const billingApi = {
  list:       (params)      => client.get('/invoices', { params }),
  get:        (id)          => client.get(`/invoices/${id}`),
  create:     (data)        => client.post('/invoices', data),
  void:       (id)          => client.patch(`/invoices/${id}/void`),
  getPayments:(id)          => client.get(`/invoices/${id}/payments`),
  addPayment: (id, data)    => client.post(`/invoices/${id}/payments`, data),
}
