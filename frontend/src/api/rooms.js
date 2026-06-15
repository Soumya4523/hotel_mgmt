import client from './client.js'

export const roomsApi = {
  list:          (params)        => client.get('/rooms', { params }),
  listAvailable: (params)        => client.get('/rooms/available', { params }),
  listTypes:     ()              => client.get('/rooms/types'),
  get:           (id)            => client.get(`/rooms/${id}`),
  create:        (data)          => client.post('/rooms', data),
  update:        (id, data)      => client.patch(`/rooms/${id}`, data),
  updateStatus:  (id, status)    => client.patch(`/rooms/${id}/status`, { status }),
  delete:        (id)            => client.delete(`/rooms/${id}`),
  createType:    (data)          => client.post('/rooms/types', data),
}
