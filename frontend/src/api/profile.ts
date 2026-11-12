import api from './client'

export const profileApi = {
  getMe: () => api.get('/me'),
  updateProfile: (data: Record<string, unknown>) => api.put('/me/profile', data),
  updatePhoto: (file: File) => {
    const fd = new FormData()
    fd.append('photo', file)
    return api.post('/me/profile-photo', fd)
  },
  report: (userId: string, category: string, reason: string) =>
    api.post('/reports', { reported_id: userId, category, reason }),
  uploadSelfie: (file: File) => {
    const fd = new FormData()
    fd.append('selfie', file)
    return api.post('/me/selfie', fd)
  },
}
