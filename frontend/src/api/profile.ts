import api from './client'

export const profileApi = {
  getMe: () => api.get('/me'),
  updateProfile: (data: Record<string, unknown>) => api.put('/me/profile', data),
  updatePhoto: (file: File) => {
    const fd = new FormData()
    fd.append('photo', file)
    return api.post('/me/profile-photo', fd)
  },
  report: (userId: string, category: string, description: string) =>
    api.post('/reports', { reported_id: userId, category, description }),

  // Onboarding
  updateOnboarding: (data: Record<string, unknown>) => api.put('/me/onboarding', data),

  // Profile photos (gallery)
  addPhoto: (file: File) => {
    const fd = new FormData()
    fd.append('photo', file)
    return api.post('/me/photos', fd)
  },
  deletePhoto: (id: number) => api.delete(`/me/photos/${id}`),
  setPrimaryPhoto: (id: number) => api.post(`/me/photos/${id}/primary`),

  // Companion application
  getCompanionApp: () => api.get('/companion/applications/me'),
  startCompanionApp: (data: Record<string, unknown>) => api.post('/companion/applications', data),
  updateCompanionApp: (data: Record<string, unknown>) => api.put('/companion/applications/me', data),
  uploadCompanionDoc: (file: File, type: string) => {
    const fd = new FormData()
    fd.append('document', file)
    fd.append('document_type', type)
    return api.post('/companion/applications/me/documents', fd)
  },

  // Selfie & voice intro
  uploadSelfie: (file: File) => {
    const fd = new FormData()
    fd.append('selfie', file)
    return api.post('/me/selfie', fd)
  },
  uploadVoiceIntro: (file: File) => {
    const fd = new FormData()
    fd.append('audio', file)
    return api.post('/me/voice-intro', fd)
  },
  deleteVoiceIntro: () => api.delete('/me/voice-intro'),
  updatePrompts: (prompts: Record<string, string | null>) =>
    api.put('/me/profile', prompts),

  // Availability
  getMyAvailability: () => api.get('/me/availability'),
  updateMyAvailability: (slots: Array<{ day_of_week: number; start_time: string; end_time: string; is_active: boolean }>) =>
    api.put('/me/availability', { slots }),
  getProfileAvailability: (userId: string) => api.get(`/profiles/${userId}/availability`),
}
