import api from './client'

export const groupVibesApi = {
  browse: () => api.get('/group-vibes'),
  mine: () => api.get('/group-vibes/mine'),
  create: (data: Record<string, unknown>) => api.post('/group-vibes', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/group-vibes/${id}`, data),
  join: (id: string) => api.post(`/group-vibes/${id}/join`),
  leave: (id: string) => api.delete(`/group-vibes/${id}/leave`),
  invite: (id: string, user_id: string) => api.post(`/group-vibes/${id}/invite`, { user_id }),
}
