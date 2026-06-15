import client from './client.js'

export const guestsApi = {
  list:            (params) => client.get('/guests', { params }),
  get:             (id)     => client.get(`/guests/${id}`),
  getReservations: (id)     => client.get(`/guests/${id}/reservations`),
  create:          (data)   => client.post('/guests', data),
  update:          (id, data) => client.patch(`/guests/${id}`, data),
  delete:          (id)     => client.delete(`/guests/${id}`),
}
