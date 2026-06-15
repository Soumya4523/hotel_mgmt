import client from './client.js'

export const housekeepingApi = {
  list:         (params)      => client.get('/housekeeping', { params }),
  get:          (id)          => client.get(`/housekeeping/${id}`),
  create:       (data)        => client.post('/housekeeping', data),
  update:       (id, data)    => client.patch(`/housekeeping/${id}`, data),
  updateStatus: (id, status)  => client.patch(`/housekeeping/${id}/status`, { status }),
}
