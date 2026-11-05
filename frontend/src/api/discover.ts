import api from './client'

export const discoverApi = {
  getProfiles: (params?: Record<string, unknown>) => api.get('/discover', { params }),
  getProfile: (id: string) => api.get(`/profiles/${id}`),
  recordView: (id: string) => api.post(`/profiles/${id}/view`),
  swipe: (swiped_id: string, direction: 'left' | 'right') => api.post('/swipes', { swiped_id, direction }),
  getSavedProfiles: () => api.get('/saved-profiles'),
  saveProfile: (saved_user_id: string) => api.post('/saved-profiles', { saved_user_id }),
  unsaveProfile: (id: string) => api.delete(`/saved-profiles/${id}`),
  getInterests: () => api.get('/interests'),
  getLanguages: () => api.get('/languages'),
  getServices: () => api.get('/services'),
  getCountries: () => api.get('/countries'),
  getCities: (countryId: string) => api.get(`/countries/${countryId}/cities`),
}
