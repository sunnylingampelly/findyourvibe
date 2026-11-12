import api from './client'

export const groupVibesApi = {
  browse: () => api.get('/group-vibes'),
  mine: () => api.get('/group-vibes/mine'),
  create: (data: Record<string, unknown>) => api.post('/group-vibes', data),
  join: (id: string) => api.post(`/group-vibes/${id}/join`),
  leave: (id: string) => api.delete(`/group-vibes/${id}/leave`),
}
