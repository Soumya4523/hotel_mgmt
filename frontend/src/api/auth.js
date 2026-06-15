import client from './client.js'

export const authApi = {
  login:   (email, password) => client.post('/auth/login', { email, password }),
  refresh: (refreshToken)    => client.post('/auth/refresh', { refreshToken }),
  logout:  ()                => client.post('/auth/logout'),
}
