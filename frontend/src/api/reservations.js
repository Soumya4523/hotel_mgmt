import client from './client.js'

export const reservationsApi = {
  list:     (params) => client.get('/reservations', { params }),
  get:      (id)     => client.get(`/reservations/${id}`),
  create:   (data)   => client.post('/reservations', data),
  update:   (id, data) => client.patch(`/reservations/${id}`, data),
  checkIn:  (id)     => client.post(`/reservations/${id}/check-in`),
  checkOut: (id)     => client.post(`/reservations/${id}/check-out`),
  cancel:   (id)     => client.post(`/reservations/${id}/cancel`),
}
