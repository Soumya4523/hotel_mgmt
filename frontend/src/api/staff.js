import client from './client.js'

export const staffApi = {
  list:   ()           => client.get('/staff'),
  get:    (id)         => client.get(`/staff/${id}`),
  create: (data)       => client.post('/staff', data),
  update: (id, data)   => client.patch(`/staff/${id}`, data),
  delete: (id)         => client.delete(`/staff/${id}`),
}
