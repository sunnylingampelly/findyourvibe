import api from './client'

export const profileApi = {
  getMe: () => api.get('/me'),
  updateProfile: (data: Record<string, unknown>) => api.put('/me/profile', data),
  updatePhoto: (file: File) => {
    const fd = new FormData(); fd.append('photo', file)
    return api.post('/me/profile-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  getPhotos: () => api.get('/me/photos'),
  addPhoto: (file: File) => {
    const fd = new FormData(); fd.append('photo', file)
    return api.post('/me/photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  deletePhoto: (id: number) => api.delete(`/me/photos/${id}`),
  setPrimaryPhoto: (id: number) => api.post(`/me/photos/${id}/primary`),
  getOnboarding: () => api.get('/me/onboarding'),
  updateOnboarding: (data: Record<string, unknown>) => api.put('/me/onboarding', data),
  report: (reported_id: string, category: string, description: string) =>
    api.post('/reports', { reported_id, category, description }),
  block: (blocked_id: string) => api.post('/blocks', { blocked_id }),
  unblock: (id: string) => api.delete(`/blocks/${id}`),
  getBlocked: () => api.get('/blocks'),
  getCompanionApp: () => api.get('/companion/applications/me'),
  startCompanionApp: (data: Record<string, unknown>) => api.post('/companion/applications', data),
  updateCompanionApp: (data: Record<string, unknown>) => api.put('/companion/applications/me', data),
  uploadCompanionDoc: (file: File, document_type: string) => {
    const fd = new FormData(); fd.append('document', file); fd.append('document_type', document_type)
    return api.post('/companion/applications/me/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}
